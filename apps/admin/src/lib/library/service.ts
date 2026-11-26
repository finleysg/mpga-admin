import {
	libraryAudit,
	libraryFile,
	libraryFileVersion,
	libraryFolder,
	libraryFolderMember,
	type Database,
} from "@mpga/database"
import { and, eq, isNull, max } from "drizzle-orm"

import { visibleFolderIds, type FolderNode, type Viewer } from "./access"
import { isInlineType, validateFile } from "./file-types"
import {
	MAX_FILE_NAME,
	MAX_FOLDER_DEPTH,
	MAX_FOLDER_NAME,
	nameTaken,
	uniqueName,
	validateName,
} from "./names"
import { newObjectKey, type LibraryStorage } from "./storage"

// All library reads and writes go through here. Callers (server actions) handle sessions;
// these functions take the viewer explicitly so they can be tested without Next.js.

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0]
type Executor = Database | Tx

export type LibraryErrorCode = "forbidden" | "not_found" | "invalid" | "name_conflict"

export type LibraryResult<T> =
	| { ok: true; data: T }
	| { ok: false; code: LibraryErrorCode; error: string; existingFileId?: number }

function fail<T>(code: LibraryErrorCode, error: string, extra?: { existingFileId?: number }) {
	return { ok: false, code, error, ...extra } as LibraryResult<T>
}

const NOT_FOUND = "That folder or file doesn't exist, or you don't have access to it."

export type AuditAction =
	| "create"
	| "rename"
	| "move"
	| "delete"
	| "restore"
	| "upload"
	| "new_version"
	| "restore_version"
	| "access_change"
	| "publish"
	| "migrate"

export async function writeAudit(
	tx: Executor,
	entry: {
		actor: string
		action: AuditAction
		entityType: "folder" | "file"
		entityId: number
		details?: Record<string, unknown>
		at?: Date
	},
) {
	await tx.insert(libraryAudit).values({
		actorUserId: entry.actor,
		action: entry.action,
		entityType: entry.entityType,
		entityId: entry.entityId,
		details: entry.details ?? null,
		createdAt: entry.at ?? new Date(),
	})
}

// ---------- Folder state ----------

export interface FolderState {
	folders: (FolderNode & { name: string; depth: number })[]
	memberships: Map<number, Set<string>>
	visible: Set<number>
}

/** The folder table is small, so visibility is computed over all of it at once. */
export async function loadFolderState(
	db: Executor,
	viewer: Viewer,
	options: { includeDeleted?: boolean } = {},
): Promise<FolderState> {
	const folders = await db
		.select({
			id: libraryFolder.id,
			parentId: libraryFolder.parentId,
			name: libraryFolder.name,
			depth: libraryFolder.depth,
			isRestricted: libraryFolder.isRestricted,
			deletedAt: libraryFolder.deletedAt,
		})
		.from(libraryFolder)
	const rows = await db.select().from(libraryFolderMember)
	const memberships = new Map<number, Set<string>>()
	for (const row of rows) {
		const set = memberships.get(row.folderId) ?? new Set<string>()
		set.add(row.userId)
		memberships.set(row.folderId, set)
	}
	return { folders, memberships, visible: visibleFolderIds(folders, memberships, viewer, options) }
}

async function liveFileNames(
	db: Executor,
	folderId: number,
): Promise<{ id: number; name: string }[]> {
	return db
		.select({ id: libraryFile.id, name: libraryFile.name })
		.from(libraryFile)
		.where(and(eq(libraryFile.folderId, folderId), isNull(libraryFile.deletedAt)))
}

async function liveFolderNames(db: Executor, parentId: number | null): Promise<string[]> {
	const rows = await db
		.select({ name: libraryFolder.name })
		.from(libraryFolder)
		.where(
			and(
				parentId === null ? isNull(libraryFolder.parentId) : eq(libraryFolder.parentId, parentId),
				isNull(libraryFolder.deletedAt),
			),
		)
	return rows.map((r) => r.name)
}

/** Serialize writes within one folder so name checks and inserts can't interleave. */
async function lockFolder(tx: Tx, folderId: number) {
	await tx
		.select({ id: libraryFolder.id })
		.from(libraryFolder)
		.where(eq(libraryFolder.id, folderId))
		.for("update")
}

// ---------- Folders ----------

export async function createFolder(
	db: Database,
	viewer: Viewer,
	input: { parentId: number | null; name: string },
	now = new Date(),
): Promise<LibraryResult<{ id: number; name: string }>> {
	if (!viewer.isDocumentAdmin) return fail("forbidden", "Only document admins can create folders.")
	const named = validateName(input.name, MAX_FOLDER_NAME)
	if (!named.ok) return fail("invalid", named.error)

	let depth = 1
	if (input.parentId !== null) {
		const state = await loadFolderState(db, viewer)
		const parent = state.folders.find((f) => f.id === input.parentId)
		if (!parent || !state.visible.has(parent.id)) return fail("not_found", NOT_FOUND)
		depth = parent.depth + 1
		if (depth > MAX_FOLDER_DEPTH) {
			return fail("invalid", `Folders can be nested up to ${MAX_FOLDER_DEPTH} levels deep.`)
		}
	}

	return db.transaction(async (tx) => {
		if (input.parentId !== null) await lockFolder(tx, input.parentId)
		if (nameTaken(named.name, await liveFolderNames(tx, input.parentId))) {
			return fail<{ id: number; name: string }>(
				"name_conflict",
				`A folder named "${named.name}" already exists here.`,
			)
		}
		const [inserted] = await tx.insert(libraryFolder).values({
			parentId: input.parentId,
			name: named.name,
			depth,
			createdBy: viewer.id,
			createdAt: now,
		})
		const id = inserted.insertId
		await writeAudit(tx, {
			actor: viewer.id,
			action: "create",
			entityType: "folder",
			entityId: id,
			details: { name: named.name, parentId: input.parentId },
			at: now,
		})
		return { ok: true as const, data: { id, name: named.name } }
	})
}

// ---------- Upload ----------

/**
 * - "new": fails with name_conflict if a file with that name exists, so the member can choose.
 * - "newVersion": adds a version to the existing file with that name (or creates it if none).
 * - "keepBoth": saves under a free name such as "Minutes (2).pdf".
 */
export type UploadMode = "new" | "newVersion" | "keepBoth"

export interface UploadedFile {
	fileId: number
	versionId: number
	versionNo: number
	name: string
}

export async function uploadFile(
	db: Database,
	storage: LibraryStorage,
	viewer: Viewer,
	input: { folderId: number; name: string; bytes: Uint8Array; mode: UploadMode },
	now = new Date(),
): Promise<LibraryResult<UploadedFile>> {
	const named = validateName(input.name, MAX_FILE_NAME)
	if (!named.ok) return fail("invalid", named.error)
	const checked = validateFile(named.name, input.bytes)
	if (!checked.ok) return fail("invalid", checked.error)

	const state = await loadFolderState(db, viewer)
	if (!state.visible.has(input.folderId)) return fail("not_found", NOT_FOUND)

	// Early answer for the common conflict case, before storing anything. Rechecked under lock.
	if (input.mode === "new") {
		const existing = (await liveFileNames(db, input.folderId)).find((f) =>
			nameTaken(named.name, [f.name]),
		)
		if (existing) {
			return fail("name_conflict", `"${named.name}" already exists in this folder.`, {
				existingFileId: existing.id,
			})
		}
	}

	// S3 can't join the transaction: store first under a fresh key. If the transaction then
	// fails, the object is orphaned but unreachable, which is harmless.
	const s3Key = newObjectKey()
	await storage.put(s3Key, input.bytes, checked.file.contentType)

	return db.transaction(async (tx): Promise<LibraryResult<UploadedFile>> => {
		await lockFolder(tx, input.folderId)
		const siblings = await liveFileNames(tx, input.folderId)
		const existing = siblings.find((f) => nameTaken(named.name, [f.name]))

		if (existing && input.mode === "new") {
			return fail("name_conflict", `"${named.name}" already exists in this folder.`, {
				existingFileId: existing.id,
			})
		}

		const version = {
			s3Key,
			size: input.bytes.byteLength,
			contentType: checked.file.contentType,
			originalName: named.name,
			uploadedBy: viewer.id,
			uploadedAt: now,
		}

		if (existing && input.mode === "newVersion") {
			const [latestRow] = await tx
				.select({ latest: max(libraryFileVersion.versionNo) })
				.from(libraryFileVersion)
				.where(eq(libraryFileVersion.fileId, existing.id))
			const versionNo = (latestRow?.latest ?? 0) + 1
			const [inserted] = await tx
				.insert(libraryFileVersion)
				.values({ ...version, fileId: existing.id, versionNo })
			const versionId = inserted.insertId
			await tx
				.update(libraryFile)
				.set({ currentVersionId: versionId, updatedBy: viewer.id, updatedAt: now })
				.where(eq(libraryFile.id, existing.id))
			await writeAudit(tx, {
				actor: viewer.id,
				action: "new_version",
				entityType: "file",
				entityId: existing.id,
				details: { versionNo, size: version.size },
				at: now,
			})
			return { ok: true, data: { fileId: existing.id, versionId, versionNo, name: existing.name } }
		}

		const name = existing
			? uniqueName(
					named.name,
					siblings.map((f) => f.name),
				)
			: named.name
		const [file] = await tx.insert(libraryFile).values({
			folderId: input.folderId,
			name,
			createdBy: viewer.id,
			createdAt: now,
			updatedBy: viewer.id,
			updatedAt: now,
		})
		const fileId = file.insertId
		const [inserted] = await tx
			.insert(libraryFileVersion)
			.values({ ...version, fileId, versionNo: 1 })
		const versionId = inserted.insertId
		await tx
			.update(libraryFile)
			.set({ currentVersionId: versionId })
			.where(eq(libraryFile.id, fileId))
		await writeAudit(tx, {
			actor: viewer.id,
			action: "upload",
			entityType: "file",
			entityId: fileId,
			details: { name, folderId: input.folderId, size: version.size },
			at: now,
		})
		return { ok: true, data: { fileId, versionId, versionNo: 1, name } }
	})
}

// ---------- Download ----------

/**
 * A short-lived link to one version, issued only after checking the viewer can see the file.
 * Files in Trash are reachable only by document admins (for review before restoring).
 */
export async function getDownloadUrl(
	db: Database,
	storage: LibraryStorage,
	viewer: Viewer,
	versionId: number,
	{ preview = false } = {},
): Promise<LibraryResult<{ url: string; inline: boolean }>> {
	const [row] = await db
		.select({
			s3Key: libraryFileVersion.s3Key,
			contentType: libraryFileVersion.contentType,
			fileName: libraryFile.name,
			folderId: libraryFile.folderId,
			deletedAt: libraryFile.deletedAt,
		})
		.from(libraryFileVersion)
		.innerJoin(libraryFile, eq(libraryFile.id, libraryFileVersion.fileId))
		.where(eq(libraryFileVersion.id, versionId))
	if (!row) return fail("not_found", NOT_FOUND)

	const includeDeleted = viewer.isDocumentAdmin
	if (row.deletedAt && !includeDeleted) return fail("not_found", NOT_FOUND)
	const state = await loadFolderState(db, viewer, { includeDeleted })
	if (!state.visible.has(row.folderId)) return fail("not_found", NOT_FOUND)

	const inline = preview && isInlineType(row.fileName)
	const url = await storage.signedUrl(row.s3Key, {
		fileName: row.fileName,
		contentType: row.contentType,
		disposition: inline ? "inline" : "attachment",
	})
	return { ok: true, data: { url, inline } }
}
