import {
	document,
	libraryFile,
	libraryFileVersion,
	libraryFolder,
	libraryPublication,
	tournament,
	type Database,
} from "@mpga/database"
import { and, asc, eq, gt, isNull, notInArray, sql } from "drizzle-orm"

import type { Viewer } from "./access"
import { fileExtension, fileTypeInfo, sniffExtension, validateFileContents } from "./file-types"
import { cleanName, MAX_FILE_NAME, MAX_FOLDER_NAME, nameTaken, uniqueName } from "./names"
import { indexVersion } from "./search"
import { liveFileNames, lockFolder, lockTree, writeAudit, type Tx } from "./service"
import { newObjectKey, type LibraryStorage } from "./storage"

// One-time import of the existing public documents (tournament, match play and settings
// documents) into the library. Each document's file is copied into the library as version 1 and
// the document is linked to it, so public pages keep showing exactly the same file. Re-running
// skips documents that are already linked.

export const TOURNAMENTS_FOLDER = "Tournaments"
export const IMPORT_BATCH_SIZE = 20

interface SourceDocument {
	id: number
	title: string
	documentType: string
	year: number | null
	file: string | null
	lastUpdate: string
	tournamentName: string | null
}

export interface ImportItem {
	documentId: number
	title: string
	/** Folder names from the top level down, e.g. ["Tournaments", "Four Ball", "2025"]. */
	folderPath: string[]
	/** Planned library file name (the extension may be filled in from the contents on import). */
	fileName: string
	size: number | null
	status: "ready" | "skip"
	reason?: string
}

export interface ImportPlan {
	alreadyImported: number
	items: ImportItem[]
	ready: number
	skipped: number
	/** Ready documents per top-level folder. */
	byTopFolder: { folder: string; count: number }[]
}

function mediaPrefix(): string {
	return process.env.S3_MEDIA_PREFIX ?? "media"
}

function publicKeyOf(file: string): string {
	return `${mediaPrefix()}/${file.replace(/^\/+/, "")}`
}

/** document.lastUpdate is a DATETIME string written in UTC. */
function parseLegacyDate(value: string): Date {
	const date = new Date(`${value.replace(" ", "T")}Z`)
	return Number.isNaN(date.getTime()) ? new Date() : date
}

function folderName(raw: string): string {
	return cleanName(raw).slice(0, MAX_FOLDER_NAME) || "Untitled"
}

/** Where a document goes: tournaments by name and year, everything else by type and year. */
export function folderPathFor(
	doc: Pick<SourceDocument, "documentType" | "year" | "tournamentName">,
) {
	const path = doc.tournamentName
		? [TOURNAMENTS_FOLDER, folderName(doc.tournamentName)]
		: [folderName(doc.documentType || "Other")]
	if (doc.year) path.push(String(doc.year))
	return path
}

/** "Four Ball Results" + "documents/123-results.PDF" -> "Four Ball Results.pdf" */
export function fileNameFor(title: string, ext: string | null): string {
	const suffix = ext ? `.${ext.toLowerCase()}` : ""
	const base = cleanName(title).slice(0, MAX_FILE_NAME - suffix.length) || "Document"
	return `${base}${suffix}`
}

function extensionOf(file: string): string | null {
	const last = file.split("/").pop() ?? ""
	return last.includes(".") ? fileExtension(last) : null
}

async function unimportedDocuments(db: Database | Tx, afterId = 0, limit?: number) {
	const linked = db.select({ id: libraryPublication.documentId }).from(libraryPublication)
	const query = db
		.select({
			id: document.id,
			title: document.title,
			documentType: document.documentType,
			year: document.year,
			file: document.file,
			lastUpdate: document.lastUpdate,
			tournamentName: tournament.name,
		})
		.from(document)
		.leftJoin(tournament, eq(tournament.id, document.tournamentId))
		.where(and(gt(document.id, afterId), notInArray(document.id, linked)))
		.orderBy(asc(document.id))
	return (limit ? query.limit(limit) : query) as Promise<SourceDocument[]>
}

// ---------- Checks shared by preview and import ----------

/** Bytes read in the preview: enough to recognise a file's type, including Office zip parts. */
const SNIFF_BYTES = 16 * 1024

type FileCheck =
	| { ok: true; ext: string; size: number }
	| { ok: false; ext: string | null; size: number | null; reason: string }

/**
 * Work out a document's file type and whether the library can take it. With only the start of
 * the file (the preview) text files can't be fully checked; the import checks the whole file.
 */
function checkBytes(
	file: string,
	bytes: Uint8Array,
	partial: boolean,
): FileCheck & { size: number | null } {
	const ext = extensionOf(file) ?? sniffExtension(bytes)
	const size = partial ? null : bytes.byteLength
	if (!ext)
		return {
			ok: false,
			ext: null,
			size,
			reason: "Couldn't tell what kind of file it is (no extension)",
		}
	const info = fileTypeInfo(`file.${ext}`)
	if (!info) return { ok: false, ext, size, reason: `.${ext} files aren't supported` }
	if (partial && info.label === "Text") return { ok: true, ext, size: 0 }
	const checked = validateFileContents(`file.${ext}`, bytes)
	if (!checked.ok)
		return { ok: false, ext, size, reason: `The file doesn't look like a ${info.label} file` }
	return { ok: true, ext, size: bytes.byteLength }
}

async function checkFile(storage: LibraryStorage, doc: SourceDocument): Promise<FileCheck> {
	if (!doc.file) return { ok: false, ext: null, size: null, reason: "No file" }
	const publicKey = publicKeyOf(doc.file)
	const head = await storage.headPublic(publicKey)
	if (!head)
		return {
			ok: false,
			ext: extensionOf(doc.file),
			size: null,
			reason: "File missing from the public bucket",
		}
	try {
		const start = await storage.readPublic(publicKey, SNIFF_BYTES)
		const check = checkBytes(doc.file, start, true)
		return check.ok ? { ...check, size: head.size } : { ...check, size: head.size }
	} catch {
		return {
			ok: false,
			ext: extensionOf(doc.file),
			size: head.size,
			reason: "Couldn't read the file from the public bucket",
		}
	}
}

// ---------- Preview ----------

/**
 * What an import would do, without changing anything: target folder and name for each document
 * not yet imported, and which ones will be skipped. Checks every file exists in the public bucket.
 */
export async function planImport(db: Database, storage: LibraryStorage): Promise<ImportPlan> {
	const [{ linked } = { linked: 0 }] = await db
		.select({ linked: sql<number>`count(*)` })
		.from(libraryPublication)
	const docs = await unimportedDocuments(db)

	// Check each public file a few at a time: does it exist, and does its start match its type?
	const checks = new Map<number, FileCheck>()
	for (let i = 0; i < docs.length; i += 10) {
		await Promise.all(
			docs.slice(i, i + 10).map(async (d) => checks.set(d.id, await checkFile(storage, d))),
		)
	}

	const taken = new Map<string, string[]>()
	const items: ImportItem[] = docs.map((d) => {
		const folderPath = folderPathFor(d)
		const check = checks.get(d.id)!
		const base = { documentId: d.id, title: d.title, folderPath, size: check.size }
		if (!check.ok) {
			return {
				...base,
				fileName: fileNameFor(d.title, check.ext),
				status: "skip" as const,
				reason: check.reason,
			}
		}
		const key = folderPath.join("/")
		const names = taken.get(key) ?? []
		const fileName = uniqueName(fileNameFor(d.title, check.ext), names, MAX_FILE_NAME)
		names.push(fileName)
		taken.set(key, names)
		return { ...base, fileName, status: "ready" as const }
	})

	const counts = new Map<string, number>()
	for (const item of items.filter((i) => i.status === "ready")) {
		counts.set(item.folderPath[0]!, (counts.get(item.folderPath[0]!) ?? 0) + 1)
	}
	return {
		alreadyImported: Number(linked),
		items,
		ready: items.filter((i) => i.status === "ready").length,
		skipped: items.filter((i) => i.status === "skip").length,
		byTopFolder: [...counts]
			.map(([folder, count]) => ({ folder, count }))
			.sort((a, b) => a.folder.localeCompare(b.folder)),
	}
}

// ---------- Import ----------

/** Find a live folder by name under `parentId`, or create it. Caller holds the tree lock. */
async function ensureFolder(
	tx: Tx,
	viewer: Viewer,
	parentId: number | null,
	name: string,
	depth: number,
	now: Date,
): Promise<number> {
	const [existing] = await tx
		.select({ id: libraryFolder.id })
		.from(libraryFolder)
		.where(
			and(
				parentId === null ? isNull(libraryFolder.parentId) : eq(libraryFolder.parentId, parentId),
				isNull(libraryFolder.deletedAt),
				eq(libraryFolder.name, name),
			),
		)
		.limit(1)
	if (existing) return existing.id
	const [inserted] = await tx.insert(libraryFolder).values({
		parentId,
		name,
		depth,
		createdBy: viewer.id,
		createdAt: now,
	})
	await writeAudit(tx, {
		actor: viewer.id,
		action: "create",
		entityType: "folder",
		entityId: inserted.insertId,
		details: { name, parentId, importedDocuments: true },
		at: now,
	})
	return inserted.insertId
}

export interface ImportResult {
	documentId: number
	title: string
	status: "imported" | "skipped"
	fileName?: string
	fileId?: number
	reason?: string
}

export interface ImportBatch {
	results: ImportResult[]
	/** Pass back as `afterDocumentId` to continue; null when every document has been processed. */
	nextAfterDocumentId: number | null
}

/**
 * Import the next `batchSize` documents after `afterDocumentId` (in id order). Skipped documents
 * are reported and passed over, so a run always moves forward. Safe to re-run.
 */
export async function importBatch(
	db: Database,
	storage: LibraryStorage,
	viewer: Viewer,
	{ afterDocumentId = 0, batchSize = IMPORT_BATCH_SIZE } = {},
): Promise<ImportBatch> {
	if (!viewer.isDocumentAdmin) throw new Error("Only document admins can import documents.")
	const docs = await unimportedDocuments(db, afterDocumentId, batchSize)
	const results: ImportResult[] = []
	for (const doc of docs) results.push(await importOne(db, storage, viewer, doc))
	const last = docs.at(-1)
	return { results, nextAfterDocumentId: docs.length < batchSize || !last ? null : last.id }
}

async function importOne(
	db: Database,
	storage: LibraryStorage,
	viewer: Viewer,
	doc: SourceDocument,
): Promise<ImportResult> {
	const skip = (reason: string): ImportResult => ({
		documentId: doc.id,
		title: doc.title,
		status: "skipped",
		reason,
	})
	if (!doc.file) return skip("No file")

	const publicKey = publicKeyOf(doc.file)
	if (!(await storage.headPublic(publicKey))) return skip("File missing from the public bucket")
	let bytes: Uint8Array
	try {
		bytes = await storage.readPublic(publicKey)
	} catch {
		return skip("Couldn't read the file from the public bucket")
	}

	const check = checkBytes(doc.file, bytes, false)
	if (!check.ok) return skip(check.reason)
	const ext = check.ext
	const contentType = fileTypeInfo(`file.${ext}`)!.contentType

	const now = new Date()
	const uploadedAt = parseLegacyDate(doc.lastUpdate)
	const s3Key = newObjectKey()
	await storage.put(s3Key, bytes, contentType)

	const saved = await db.transaction(async (tx) => {
		// Another run may have imported it meanwhile.
		const [linked] = await tx
			.select({ id: libraryPublication.documentId })
			.from(libraryPublication)
			.where(eq(libraryPublication.documentId, doc.id))
			.for("update")
		if (linked) return null

		await lockTree(tx)
		let parentId: number | null = null
		const path = folderPathFor(doc)
		for (let i = 0; i < path.length; i++) {
			parentId = await ensureFolder(tx, viewer, parentId, path[i]!, i + 1, now)
		}
		const folderId = parentId!
		await lockFolder(tx, folderId)
		const siblings = (await liveFileNames(tx, folderId)).map((f) => f.name)
		const wanted = fileNameFor(doc.title, ext)
		const name = nameTaken(wanted, siblings) ? uniqueName(wanted, siblings, MAX_FILE_NAME) : wanted

		const [file] = await tx.insert(libraryFile).values({
			folderId,
			name,
			createdBy: viewer.id,
			createdAt: uploadedAt,
			updatedBy: viewer.id,
			updatedAt: uploadedAt,
		})
		const fileId = file.insertId
		const [version] = await tx.insert(libraryFileVersion).values({
			fileId,
			versionNo: 1,
			s3Key,
			size: bytes.byteLength,
			contentType,
			originalName: doc.file!.split("/").pop() ?? name,
			uploadedBy: viewer.id,
			uploadedAt,
		})
		const versionId = version.insertId
		await tx
			.update(libraryFile)
			.set({ currentVersionId: versionId })
			.where(eq(libraryFile.id, fileId))
		await tx.insert(libraryPublication).values({
			documentId: doc.id,
			versionId,
			publishedBy: viewer.id,
			publishedAt: uploadedAt,
		})
		await writeAudit(tx, {
			actor: viewer.id,
			action: "migrate",
			entityType: "file",
			entityId: fileId,
			details: { documentId: doc.id, publicKey, folder: path.join(" / ") },
			at: now,
		})
		return { fileId, versionId, name }
	})
	if (!saved) return skip("Already imported")

	try {
		await indexVersion(db, saved.versionId, saved.name, bytes)
	} catch (error) {
		console.warn(`Indexing imported document ${doc.id} failed:`, error)
	}
	return {
		documentId: doc.id,
		title: doc.title,
		status: "imported",
		fileName: saved.name,
		fileId: saved.fileId,
	}
}
