import crypto from "node:crypto"

import {
	document,
	libraryFile,
	libraryFileVersion,
	libraryPublication,
	tournament,
	type Database,
} from "@mpga/database"
import { and, eq, inArray, isNull } from "drizzle-orm"

import { documentKey } from "../document-keys"
import { folderPath, type Viewer } from "./access"
import { fail, loadFolderState, NOT_FOUND, writeAudit, type LibraryResult } from "./service"
import type { LibraryStorage } from "./storage"

// Publishing copies one library version into the public media bucket and points a `document`
// (a tournament, match play or settings document) at that copy. It's a snapshot: later versions
// don't change the public file until a document admin re-publishes.

const ADMIN_ONLY = "Only document admins can publish library files."

/**
 * Public key relative to the media prefix, the format `document.file` stores. Unique per
 * publish: a timestamp alone repeats when several documents are re-published at once, and
 * documents must never share an object, since deleting a document deletes its file.
 */
export function publicKeyFor(fileName: string, documentId: number, now: Date): string {
	const unique = crypto.randomUUID().slice(0, 8)
	// Shortened to fit document.file, keeping this unique prefix and the extension.
	return documentKey(`documents/${now.getTime()}-${documentId}-${unique}-`, fileName)
}

function mediaPrefix(): string {
	return process.env.S3_MEDIA_PREFIX ?? "media"
}

function legacyTimestamp(now: Date): string {
	// `document.lastUpdate` is a DATETIME string column.
	return now.toISOString().replace("T", " ").replace("Z", "")
}

interface VisibleVersion {
	versionId: number
	versionNo: number
	fileId: number
	fileName: string
	s3Key: string
	contentType: string
	restricted: boolean
}

async function findPublishableVersion(
	db: Database,
	viewer: Viewer,
	where: { versionId: number } | { fileId: number },
): Promise<VisibleVersion | null> {
	const [row] = await db
		.select({
			versionId: libraryFileVersion.id,
			versionNo: libraryFileVersion.versionNo,
			fileId: libraryFile.id,
			fileName: libraryFile.name,
			folderId: libraryFile.folderId,
			s3Key: libraryFileVersion.s3Key,
			contentType: libraryFileVersion.contentType,
		})
		.from(libraryFile)
		.innerJoin(
			libraryFileVersion,
			"versionId" in where
				? eq(libraryFileVersion.fileId, libraryFile.id)
				: eq(libraryFileVersion.id, libraryFile.currentVersionId),
		)
		.where(
			and(
				isNull(libraryFile.deletedAt),
				"versionId" in where
					? eq(libraryFileVersion.id, where.versionId)
					: eq(libraryFile.id, where.fileId),
			),
		)
	if (!row) return null
	const state = await loadFolderState(db, viewer)
	if (!state.visible.has(row.folderId)) return null
	const restricted = folderPath(state.folders, row.folderId).some((f) => f.isRestricted)
	return { ...row, restricted }
}

/**
 * Publish a library version to an existing document: copy it into the public bucket, point the
 * document at the copy, and record the link. Defaults to the file's current version.
 */
export async function publishToDocument(
	db: Database,
	storage: LibraryStorage,
	viewer: Viewer,
	input: { documentId: number; fileId: number; versionId?: number },
	now = new Date(),
): Promise<LibraryResult<{ file: string; versionNo: number }>> {
	if (!viewer.isDocumentAdmin) return fail("forbidden", ADMIN_ONLY)
	const version = await findPublishableVersion(
		db,
		viewer,
		input.versionId ? { versionId: input.versionId } : { fileId: input.fileId },
	)
	if (!version || version.fileId !== input.fileId) return fail("not_found", NOT_FOUND)
	const [doc] = await db
		.select({ id: document.id })
		.from(document)
		.where(eq(document.id, input.documentId))
	if (!doc) return fail("not_found", "That document doesn't exist.")

	// Copy first (S3 can't join the transaction). A failed transaction leaves an unused public
	// copy with an unguessable timestamped name, which is harmless.
	const key = publicKeyFor(version.fileName, input.documentId, now)
	await storage.copyToPublic(version.s3Key, `${mediaPrefix()}/${key}`, version.contentType)

	return db.transaction(async (tx) => {
		await tx
			.update(document)
			.set({ file: key, lastUpdate: legacyTimestamp(now) })
			.where(eq(document.id, input.documentId))
		await tx
			.insert(libraryPublication)
			.values({
				documentId: input.documentId,
				versionId: version.versionId,
				publishedBy: viewer.id,
				publishedAt: now,
			})
			.onDuplicateKeyUpdate({
				set: { versionId: version.versionId, publishedBy: viewer.id, publishedAt: now },
			})
		await writeAudit(tx, {
			actor: viewer.id,
			action: "publish",
			entityType: "file",
			entityId: version.fileId,
			details: {
				documentId: input.documentId,
				versionNo: version.versionNo,
				publicKey: key,
				fromRestrictedFolder: version.restricted,
			},
			at: now,
		})
		return { ok: true as const, data: { file: key, versionNo: version.versionNo } }
	})
}

export interface Publication {
	documentId: number
	title: string
	documentType: string
	year: number | null
	tournamentName: string | null
	/** Public key, for getMediaUrl. */
	file: string | null
	versionNo: number
	isCurrent: boolean
	publishedAt: Date
}

/** Where a library file is published, and whether each copy is the current version. */
export async function listPublications(
	db: Database,
	viewer: Viewer,
	fileId: number,
): Promise<LibraryResult<Publication[]>> {
	const [file] = await db
		.select({ currentVersionId: libraryFile.currentVersionId, folderId: libraryFile.folderId })
		.from(libraryFile)
		.where(eq(libraryFile.id, fileId))
	if (!file) return fail("not_found", NOT_FOUND)
	const state = await loadFolderState(db, viewer, { includeDeleted: viewer.isDocumentAdmin })
	if (!state.visible.has(file.folderId)) return fail("not_found", NOT_FOUND)

	const rows = await db
		.select({
			documentId: document.id,
			title: document.title,
			documentType: document.documentType,
			year: document.year,
			tournamentName: tournament.name,
			file: document.file,
			versionId: libraryPublication.versionId,
			versionNo: libraryFileVersion.versionNo,
			publishedAt: libraryPublication.publishedAt,
		})
		.from(libraryPublication)
		.innerJoin(libraryFileVersion, eq(libraryFileVersion.id, libraryPublication.versionId))
		.innerJoin(document, eq(document.id, libraryPublication.documentId))
		.leftJoin(tournament, eq(tournament.id, document.tournamentId))
		.where(eq(libraryFileVersion.fileId, fileId))
	return {
		ok: true,
		data: rows
			.map((r) => ({
				documentId: r.documentId,
				title: r.title,
				documentType: r.documentType,
				year: r.year,
				tournamentName: r.tournamentName,
				file: r.file,
				versionNo: r.versionNo,
				isCurrent: r.versionId === file.currentVersionId,
				publishedAt: r.publishedAt,
			}))
			.sort((a, b) => a.title.localeCompare(b.title)),
	}
}

/** Re-publish the current version to every document showing an older one. */
export async function republishLatest(
	db: Database,
	storage: LibraryStorage,
	viewer: Viewer,
	fileId: number,
	now = new Date(),
): Promise<LibraryResult<{ updated: number }>> {
	if (!viewer.isDocumentAdmin) return fail("forbidden", ADMIN_ONLY)
	const publications = await listPublications(db, viewer, fileId)
	if (!publications.ok) return publications
	let updated = 0
	for (const p of publications.data.filter((p) => !p.isCurrent)) {
		const result = await publishToDocument(
			db,
			storage,
			viewer,
			{ documentId: p.documentId, fileId },
			now,
		)
		if (!result.ok) return result
		updated++
	}
	return { ok: true, data: { updated } }
}

/** The library file a document was published from, if any (for the document forms). */
export async function getDocumentSource(
	db: Database,
	documentIds: number[],
): Promise<
	Map<number, { fileId: number; fileName: string; versionNo: number; isCurrent: boolean }>
> {
	if (documentIds.length === 0) return new Map()
	const rows = await db
		.select({
			documentId: libraryPublication.documentId,
			fileId: libraryFile.id,
			fileName: libraryFile.name,
			versionId: libraryPublication.versionId,
			versionNo: libraryFileVersion.versionNo,
			currentVersionId: libraryFile.currentVersionId,
		})
		.from(libraryPublication)
		.innerJoin(libraryFileVersion, eq(libraryFileVersion.id, libraryPublication.versionId))
		.innerJoin(libraryFile, eq(libraryFile.id, libraryFileVersion.fileId))
		.where(inArray(libraryPublication.documentId, documentIds))
	return new Map(
		rows.map((r) => [
			r.documentId,
			{
				fileId: r.fileId,
				fileName: r.fileName,
				versionNo: r.versionNo,
				isCurrent: r.versionId === r.currentVersionId,
			},
		]),
	)
}
