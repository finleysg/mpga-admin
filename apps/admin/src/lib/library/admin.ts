import crypto from "node:crypto"

import {
	libraryFile,
	libraryFileVersion,
	libraryFolder,
	libraryFolderMember,
	user,
	type Database,
} from "@mpga/database"
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm"

import { descendantFolderIds, folderPath, subtreeHeight, type Viewer } from "./access"
import { fileExtension } from "./file-types"
import { MAX_FILE_NAME, MAX_FOLDER_DEPTH, MAX_FOLDER_NAME, uniqueName, validateName } from "./names"
import { copyVersionText } from "./search"
import {
	fail,
	insertVersion,
	isDuplicateKeyError,
	liveFileNames,
	liveFolderNames,
	loadFolderState,
	lockFolder,
	lockTree,
	NOT_FOUND,
	writeAudit,
	type LibraryResult,
	type Tx,
} from "./service"

// Document-admin operations: rename, move, restrict, delete to Trash, restore, restore version.
// Every function checks the viewer is a document admin and writes its audit row in the same
// transaction as the change.

const ADMIN_ONLY = "Only document admins can do that."

type Ok = LibraryResult<null>
const OK: Ok = { ok: true, data: null }

function forbidden<T>() {
	return fail<T>("forbidden", ADMIN_ONLY)
}

/** Run `work`, turning a duplicate-name error from the unique index into a name conflict. */
async function guardNames<T>(work: () => Promise<LibraryResult<T>>, conflict: string) {
	try {
		return await work()
	} catch (error) {
		if (isDuplicateKeyError(error)) return fail<T>("name_conflict", conflict)
		throw error
	}
}

// ---------- Folders ----------

export async function renameFolder(
	db: Database,
	viewer: Viewer,
	folderId: number,
	rawName: string,
	now = new Date(),
): Promise<Ok> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const named = validateName(rawName, MAX_FOLDER_NAME)
	if (!named.ok) return fail("invalid", named.error)
	const state = await loadFolderState(db, viewer)
	const folder = state.folders.find((f) => f.id === folderId && state.visible.has(f.id))
	if (!folder) return fail("not_found", NOT_FOUND)
	if (folder.name === named.name) return OK

	return guardNames(
		() =>
			db.transaction(async (tx) => {
				await tx
					.update(libraryFolder)
					.set({ name: named.name })
					.where(eq(libraryFolder.id, folderId))
				await writeAudit(tx, {
					actor: viewer.id,
					action: "rename",
					entityType: "folder",
					entityId: folderId,
					details: { from: folder.name, to: named.name },
					at: now,
				})
				return OK
			}),
		`A folder named "${named.name}" already exists there.`,
	)
}

/** Move a folder (and everything below it) under `targetParentId`, or to the top level. */
export async function moveFolder(
	db: Database,
	viewer: Viewer,
	folderId: number,
	targetParentId: number | null,
	now = new Date(),
): Promise<Ok> {
	if (!viewer.isDocumentAdmin) return forbidden()
	let folderName = ""

	return guardNames(
		() =>
			db.transaction(async (tx): Promise<Ok> => {
				// Validate against the tree as it is once we hold the lock, not as it was before:
				// otherwise two crossing moves (A under B, B under A) could both pass and form a cycle.
				await lockTree(tx)
				const state = await loadFolderState(tx, viewer, { includeDeleted: true })
				const folder = state.folders.find((f) => f.id === folderId && f.deletedAt === null)
				if (!folder) return fail("not_found", NOT_FOUND)
				folderName = folder.name
				if (folder.parentId === targetParentId) return OK

				const subtree = descendantFolderIds(state.folders, folderId)
				let newDepth = 1
				if (targetParentId !== null) {
					const target = state.folders.find((f) => f.id === targetParentId && f.deletedAt === null)
					if (!target) return fail("not_found", NOT_FOUND)
					if (subtree.has(targetParentId)) {
						return fail("invalid", "A folder can't be moved into itself or one of its subfolders.")
					}
					newDepth = target.depth + 1
				}
				if (newDepth + subtreeHeight(state.folders, folderId) > MAX_FOLDER_DEPTH) {
					return fail(
						"invalid",
						`That would nest folders more than ${MAX_FOLDER_DEPTH} levels deep.`,
					)
				}
				const delta = newDepth - folder.depth

				await tx
					.update(libraryFolder)
					.set({ parentId: targetParentId })
					.where(eq(libraryFolder.id, folderId))
				if (delta !== 0) {
					await tx
						.update(libraryFolder)
						.set({ depth: sql`${libraryFolder.depth} + ${delta}` })
						.where(inArray(libraryFolder.id, [...subtree]))
				}
				await writeAudit(tx, {
					actor: viewer.id,
					action: "move",
					entityType: "folder",
					entityId: folderId,
					details: { fromParentId: folder.parentId, toParentId: targetParentId },
					at: now,
				})
				return OK
			}),
		`A folder with that name already exists there.`,
	).then((result) =>
		!result.ok && result.code === "name_conflict" && folderName
			? fail<null>("name_conflict", `A folder named "${folderName}" already exists there.`)
			: result,
	)
}

export interface MemberOption {
	id: string
	name: string
	email: string
	isDocumentAdmin: boolean
}

/** People who can be given access to a restricted folder. Document admins always have it. */
export async function listLibraryMembers(db: Database): Promise<MemberOption[]> {
	const rows = await db
		.select({ id: user.id, name: user.name, email: user.email, role: user.role })
		.from(user)
		.where(
			and(
				inArray(user.role, ["board", "admin", "super_admin"]),
				sql`coalesce(${user.banned}, false) = false`,
			),
		)
	return rows
		.map((r) => ({ id: r.id, name: r.name, email: r.email, isDocumentAdmin: r.role !== "board" }))
		.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
}

export interface FolderAccess {
	isRestricted: boolean
	memberIds: string[]
	members: MemberOption[]
}

export async function getFolderAccess(
	db: Database,
	viewer: Viewer,
	folderId: number,
): Promise<LibraryResult<FolderAccess>> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const state = await loadFolderState(db, viewer)
	const folder = state.folders.find((f) => f.id === folderId && state.visible.has(f.id))
	if (!folder) return fail("not_found", NOT_FOUND)
	const members = await listLibraryMembers(db)
	// Drop memberships of people who can no longer be chosen (promoted to admin, banned or
	// removed). They'd be invisible in the dialog yet make every save fail validation; saving
	// without them also clears the stale rows.
	const selectable = new Set(members.filter((m) => !m.isDocumentAdmin).map((m) => m.id))
	return {
		ok: true,
		data: {
			isRestricted: folder.isRestricted,
			memberIds: [...(state.memberships.get(folderId) ?? [])].filter((id) => selectable.has(id)),
			members,
		},
	}
}

/**
 * Turn restriction on (with exactly `memberIds` as members) or off. Members must be board
 * members; document admins always have access, so they're never stored.
 */
export async function setFolderRestriction(
	db: Database,
	viewer: Viewer,
	folderId: number,
	input: { restricted: boolean; memberIds: string[] },
	now = new Date(),
): Promise<Ok> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const state = await loadFolderState(db, viewer)
	const folder = state.folders.find((f) => f.id === folderId && state.visible.has(f.id))
	if (!folder) return fail("not_found", NOT_FOUND)

	const boardIds = new Set(
		(await listLibraryMembers(db)).filter((m) => !m.isDocumentAdmin).map((m) => m.id),
	)
	const memberIds = input.restricted ? [...new Set(input.memberIds)] : []
	if (memberIds.some((id) => !boardIds.has(id))) {
		return fail("invalid", "Only board members can be chosen.")
	}
	const before = [...(state.memberships.get(folderId) ?? [])].sort()

	return db.transaction(async (tx) => {
		await tx
			.update(libraryFolder)
			.set({ isRestricted: input.restricted })
			.where(eq(libraryFolder.id, folderId))
		await tx.delete(libraryFolderMember).where(eq(libraryFolderMember.folderId, folderId))
		if (memberIds.length) {
			await tx.insert(libraryFolderMember).values(memberIds.map((userId) => ({ folderId, userId })))
		}
		await writeAudit(tx, {
			actor: viewer.id,
			action: "access_change",
			entityType: "folder",
			entityId: folderId,
			details: {
				restricted: { from: folder.isRestricted, to: input.restricted },
				members: { from: before, to: memberIds.sort() },
			},
			at: now,
		})
		return OK
	})
}

/** Send a folder and everything below it to Trash as one batch, restorable together. */
export async function deleteFolder(
	db: Database,
	viewer: Viewer,
	folderId: number,
	now = new Date(),
): Promise<Ok> {
	if (!viewer.isDocumentAdmin) return forbidden()
	return db.transaction(async (tx): Promise<Ok> => {
		// Under the tree lock the subtree can't change (e.g. a folder moved in) mid-delete.
		await lockTree(tx)
		const state = await loadFolderState(tx, viewer, { includeDeleted: true })
		const folder = state.folders.find((f) => f.id === folderId && f.deletedAt === null)
		if (!folder) return fail("not_found", NOT_FOUND)
		// Items already in Trash keep their own batch, so they're restored separately.
		const ids = [...descendantFolderIds(state.folders, folderId)].filter(
			(id) => state.folders.find((f) => f.id === id)?.deletedAt === null,
		)
		const batch = crypto.randomUUID()
		const mark = { deletedAt: now, deletedBy: viewer.id, deletedBatchId: batch }
		await tx
			.update(libraryFile)
			.set(mark)
			.where(and(inArray(libraryFile.folderId, ids), isNull(libraryFile.deletedAt)))
		await tx.update(libraryFolder).set(mark).where(inArray(libraryFolder.id, ids))
		await writeAudit(tx, {
			actor: viewer.id,
			action: "delete",
			entityType: "folder",
			entityId: folderId,
			details: { name: folder.name, batch, folders: ids.length },
			at: now,
		})
		return OK
	})
}

// ---------- Files ----------

async function liveFile(db: Database | Tx, fileId: number) {
	const [file] = await db
		.select({ id: libraryFile.id, name: libraryFile.name, folderId: libraryFile.folderId })
		.from(libraryFile)
		.where(and(eq(libraryFile.id, fileId), isNull(libraryFile.deletedAt)))
	return file ?? null
}

export async function renameFile(
	db: Database,
	viewer: Viewer,
	fileId: number,
	rawName: string,
	now = new Date(),
): Promise<Ok> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const named = validateName(rawName, MAX_FILE_NAME)
	if (!named.ok) return fail("invalid", named.error)
	const file = await liveFile(db, fileId)
	if (!file) return fail("not_found", NOT_FOUND)
	// The extension decides how the file is checked and served, so it can't change.
	if (fileExtension(named.name) !== fileExtension(file.name)) {
		return fail("invalid", `Keep the .${fileExtension(file.name)} extension.`)
	}
	if (file.name === named.name) return OK

	return guardNames(
		() =>
			db.transaction(async (tx) => {
				await tx
					.update(libraryFile)
					.set({ name: named.name, updatedBy: viewer.id, updatedAt: now })
					.where(eq(libraryFile.id, fileId))
				await writeAudit(tx, {
					actor: viewer.id,
					action: "rename",
					entityType: "file",
					entityId: fileId,
					details: { from: file.name, to: named.name },
					at: now,
				})
				return OK
			}),
		`"${named.name}" already exists in this folder.`,
	)
}

export async function moveFile(
	db: Database,
	viewer: Viewer,
	fileId: number,
	targetFolderId: number,
	now = new Date(),
): Promise<Ok> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const file = await liveFile(db, fileId)
	if (!file) return fail("not_found", NOT_FOUND)
	if (file.folderId === targetFolderId) return OK
	const state = await loadFolderState(db, viewer)
	if (!state.visible.has(targetFolderId)) return fail("not_found", NOT_FOUND)

	return guardNames(
		() =>
			db.transaction(async (tx) => {
				if (!(await lockFolder(tx, targetFolderId))) return fail<null>("not_found", NOT_FOUND)
				await tx
					.update(libraryFile)
					.set({ folderId: targetFolderId, updatedBy: viewer.id, updatedAt: now })
					.where(eq(libraryFile.id, fileId))
				await writeAudit(tx, {
					actor: viewer.id,
					action: "move",
					entityType: "file",
					entityId: fileId,
					details: { fromFolderId: file.folderId, toFolderId: targetFolderId },
					at: now,
				})
				return OK
			}),
		`"${file.name}" already exists in that folder.`,
	)
}

export async function deleteFile(
	db: Database,
	viewer: Viewer,
	fileId: number,
	now = new Date(),
): Promise<Ok> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const file = await liveFile(db, fileId)
	if (!file) return fail("not_found", NOT_FOUND)
	return db.transaction(async (tx) => {
		await tx
			.update(libraryFile)
			.set({ deletedAt: now, deletedBy: viewer.id, deletedBatchId: crypto.randomUUID() })
			.where(eq(libraryFile.id, fileId))
		await writeAudit(tx, {
			actor: viewer.id,
			action: "delete",
			entityType: "file",
			entityId: fileId,
			details: { name: file.name, folderId: file.folderId },
			at: now,
		})
		return OK
	})
}

/** Make an earlier version current by adding it again as a new version. History is kept. */
export async function restoreVersion(
	db: Database,
	viewer: Viewer,
	fileId: number,
	versionId: number,
	now = new Date(),
): Promise<LibraryResult<{ versionNo: number }>> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const file = await liveFile(db, fileId)
	if (!file) return fail("not_found", NOT_FOUND)
	const [version] = await db
		.select()
		.from(libraryFileVersion)
		.where(and(eq(libraryFileVersion.id, versionId), eq(libraryFileVersion.fileId, fileId)))
	if (!version) return fail("not_found", NOT_FOUND)

	return db.transaction(async (tx) => {
		if (!(await lockFolder(tx, file.folderId))) {
			return fail<{ versionNo: number }>("not_found", NOT_FOUND)
		}
		// Stored objects are never modified, so the new version can share the old object.
		const added = await insertVersion(
			tx,
			viewer,
			fileId,
			{
				s3Key: version.s3Key,
				size: version.size,
				contentType: version.contentType,
				originalName: version.originalName,
				uploadedBy: viewer.id,
				uploadedAt: now,
				restoredFromVersionId: version.id,
			},
			now,
			"restore_version",
		)
		await copyVersionText(tx, version.id, added.versionId)
		return { ok: true as const, data: { versionNo: added.versionNo } }
	})
}

// ---------- Trash ----------

export interface TrashItem {
	kind: "folder" | "file"
	id: number
	name: string
	/** Where it was, e.g. "Board / Minutes". Empty at the top level. */
	location: string
	/** False when its original parent folder is also in Trash (separately), so a target is needed. */
	parentIsLive: boolean
	deletedAt: Date
	deletedByName: string | null
	/** Folders deleted with it. */
	folderCount: number
	/** Files deleted with it. */
	fileCount: number
}

/**
 * One row per delete action: a folder deleted with its contents shows once, with counts.
 * Nothing is purged automatically.
 */
export async function listTrash(db: Database, viewer: Viewer): Promise<LibraryResult<TrashItem[]>> {
	if (!viewer.isDocumentAdmin) return forbidden()
	const state = await loadFolderState(db, viewer, { includeDeleted: true })
	const folderRows = await db
		.select({
			id: libraryFolder.id,
			parentId: libraryFolder.parentId,
			name: libraryFolder.name,
			deletedAt: libraryFolder.deletedAt,
			batch: libraryFolder.deletedBatchId,
			deletedByName: user.name,
		})
		.from(libraryFolder)
		.leftJoin(user, eq(user.id, libraryFolder.deletedBy))
		.where(isNotNull(libraryFolder.deletedAt))
	const fileRows = await db
		.select({
			id: libraryFile.id,
			folderId: libraryFile.folderId,
			name: libraryFile.name,
			deletedAt: libraryFile.deletedAt,
			batch: libraryFile.deletedBatchId,
			deletedByName: user.name,
		})
		.from(libraryFile)
		.leftJoin(user, eq(user.id, libraryFile.deletedBy))
		.where(isNotNull(libraryFile.deletedAt))

	const folderById = new Map(state.folders.map((f) => [f.id, f]))
	const batchOfFolder = new Map(folderRows.map((f) => [f.id, f.batch]))
	const location = (parentId: number | null) =>
		parentId === null
			? ""
			: folderPath(state.folders, parentId)
					.map((f) => f.name)
					.join(" / ")
	const parentLive = (parentId: number | null) =>
		parentId === null || folderById.get(parentId)?.deletedAt === null

	const items: TrashItem[] = []
	for (const f of folderRows) {
		// Skip folders that went to Trash as part of their parent's batch.
		if (f.parentId !== null && batchOfFolder.get(f.parentId) === f.batch) continue
		items.push({
			kind: "folder",
			id: f.id,
			name: f.name,
			location: location(f.parentId),
			parentIsLive: parentLive(f.parentId),
			deletedAt: f.deletedAt!,
			deletedByName: f.deletedByName,
			folderCount: folderRows.filter((r) => r.batch === f.batch).length,
			fileCount: fileRows.filter((r) => r.batch === f.batch).length,
		})
	}
	for (const f of fileRows) {
		if (batchOfFolder.get(f.folderId) === f.batch) continue
		items.push({
			kind: "file",
			id: f.id,
			name: f.name,
			location: location(f.folderId),
			parentIsLive: parentLive(f.folderId),
			deletedAt: f.deletedAt!,
			deletedByName: f.deletedByName,
			folderCount: 0,
			fileCount: 1,
		})
	}
	items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime())
	return { ok: true, data: items }
}

/**
 * Restore an item (and, for a folder, everything deleted with it). It goes back where it was
 * if that folder is live; otherwise to `target` — the top level for folders (default), or a
 * chosen folder for files. If a live item now has the same name, the restored one gets " (2)".
 */
export async function restoreFromTrash(
	db: Database,
	viewer: Viewer,
	item: { kind: "folder" | "file"; id: number },
	target?: number | null,
	now = new Date(),
): Promise<LibraryResult<{ name: string; folderId: number | null }>> {
	type Result = LibraryResult<{ name: string; folderId: number | null }>
	if (!viewer.isDocumentAdmin) return forbidden()

	if (item.kind === "file") {
		const [file] = await db.select().from(libraryFile).where(eq(libraryFile.id, item.id))
		if (!file?.deletedAt) return fail("not_found", NOT_FOUND)
		return db.transaction(async (tx): Promise<Result> => {
			// Prefer the original folder; it must still be live once we hold its lock.
			let folderId: number | null = null
			if (await lockFolder(tx, file.folderId)) folderId = file.folderId
			else if (target !== undefined && target !== null) {
				if (!(await lockFolder(tx, target))) return fail("not_found", NOT_FOUND)
				folderId = target
			} else {
				return fail("invalid", "Its folder is in Trash. Choose a folder to restore it to.")
			}
			const [current] = await tx
				.select({ deletedAt: libraryFile.deletedAt })
				.from(libraryFile)
				.where(eq(libraryFile.id, file.id))
			if (!current?.deletedAt) return fail("not_found", NOT_FOUND)
			const name = uniqueName(
				file.name,
				(await liveFileNames(tx, folderId)).map((f) => f.name),
				MAX_FILE_NAME,
			)
			await tx
				.update(libraryFile)
				.set({ deletedAt: null, deletedBy: null, deletedBatchId: null, folderId, name })
				.where(eq(libraryFile.id, file.id))
			await writeAudit(tx, {
				actor: viewer.id,
				action: "restore",
				entityType: "file",
				entityId: file.id,
				details: { folderId, ...(name !== file.name ? { renamedTo: name } : {}) },
				at: now,
			})
			return { ok: true, data: { name, folderId } }
		})
	}

	return db.transaction(async (tx): Promise<Result> => {
		// Depth and placement are checked against the tree as it is under the lock.
		await lockTree(tx)
		const state = await loadFolderState(tx, viewer, { includeDeleted: true })
		const isLive = (id: number) => state.folders.find((f) => f.id === id)?.deletedAt === null
		const folder = state.folders.find((f) => f.id === item.id)
		if (!folder?.deletedAt) return fail("not_found", NOT_FOUND)
		const [row] = await tx
			.select({ batch: libraryFolder.deletedBatchId })
			.from(libraryFolder)
			.where(eq(libraryFolder.id, folder.id))
		const batch = row?.batch
		if (!batch) return fail("not_found", NOT_FOUND)

		const parentId =
			folder.parentId !== null && isLive(folder.parentId) ? folder.parentId : (target ?? null)
		if (parentId !== null && !isLive(parentId)) return fail("not_found", NOT_FOUND)
		const parentDepth =
			parentId === null ? 0 : (state.folders.find((f) => f.id === parentId)?.depth ?? 0)
		if (parentDepth + 1 + subtreeHeight(state.folders, folder.id) > MAX_FOLDER_DEPTH) {
			return fail("invalid", `That would nest folders more than ${MAX_FOLDER_DEPTH} levels deep.`)
		}
		const delta = parentDepth + 1 - folder.depth
		const subtree = [...descendantFolderIds(state.folders, folder.id)]

		const name = uniqueName(folder.name, await liveFolderNames(tx, parentId), MAX_FOLDER_NAME)
		const clear = { deletedAt: null, deletedBy: null, deletedBatchId: null }
		await tx.update(libraryFolder).set({ parentId, name }).where(eq(libraryFolder.id, folder.id))
		if (delta !== 0) {
			await tx
				.update(libraryFolder)
				.set({ depth: sql`${libraryFolder.depth} + ${delta}` })
				.where(inArray(libraryFolder.id, subtree))
		}
		await tx.update(libraryFolder).set(clear).where(eq(libraryFolder.deletedBatchId, batch))
		await tx.update(libraryFile).set(clear).where(eq(libraryFile.deletedBatchId, batch))
		await writeAudit(tx, {
			actor: viewer.id,
			action: "restore",
			entityType: "folder",
			entityId: folder.id,
			details: { parentId, batch, ...(name !== folder.name ? { renamedTo: name } : {}) },
			at: now,
		})
		return { ok: true, data: { name, folderId: folder.id } }
	})
}
