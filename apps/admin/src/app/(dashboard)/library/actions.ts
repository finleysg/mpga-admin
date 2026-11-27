"use server"

import type { ActionResult } from "@mpga/types"
import { after } from "next/server"

import { db } from "@/lib/db"
import {
	deleteFile,
	deleteFolder,
	getFolderAccess,
	moveFile,
	moveFolder,
	renameFile,
	renameFolder,
	restoreFromTrash,
	restoreVersion,
	setFolderRestriction,
	type FolderAccess,
} from "@/lib/library/admin"
import { indexVersion } from "@/lib/library/search"
import {
	createFolder,
	getDownloadUrl,
	uploadFile,
	uploadVersion,
	type LibraryResult,
	type UploadMode,
} from "@/lib/library/service"
import { getLibraryStorage } from "@/lib/library/storage"
import type { UploadActionResult } from "@/lib/library/types"
import { requireLibraryUser } from "@/lib/require-auth"

const UNAUTHORIZED = { success: false, error: "Unauthorized" } as const
const UPLOAD_MODES: readonly UploadMode[] = ["new", "newVersion", "keepBoth"]

/** Extract searchable text after the response is sent, so uploads stay quick. */
function scheduleIndexing(versionId: number, name: string, bytes: Uint8Array) {
	after(async () => {
		try {
			await indexVersion(db, versionId, name, bytes)
		} catch (error) {
			console.error(`Indexing ${name} for search failed:`, error)
		}
	})
}

function toActionResult<T>(result: LibraryResult<T>): ActionResult<T> {
	return result.ok ? { success: true, data: result.data } : { success: false, error: result.error }
}

/** One file per call, so each upload stays under the server action body limit. */
export async function uploadFileAction(formData: FormData): Promise<UploadActionResult> {
	const viewer = await requireLibraryUser()
	if (!viewer) return UNAUTHORIZED

	const file = formData.get("file")
	const folderId = Number(formData.get("folderId"))
	const mode = (formData.get("mode") ?? "new") as UploadMode
	if (!(file instanceof File) || !Number.isInteger(folderId) || !UPLOAD_MODES.includes(mode)) {
		return { success: false, error: "Choose a file and a folder." }
	}

	try {
		const bytes = new Uint8Array(await file.arrayBuffer())
		const result = await uploadFile(db, getLibraryStorage(), viewer, {
			folderId,
			name: file.name,
			bytes,
			mode,
		})
		if (result.ok) scheduleIndexing(result.data.versionId, result.data.name, bytes)
		if (!result.ok && result.code === "name_conflict" && result.existingFileId) {
			return {
				success: false,
				error: result.error,
				conflict: { existingFileId: result.existingFileId },
			}
		}
		return toActionResult(result)
	} catch (error) {
		console.error("Library upload failed:", error)
		return { success: false, error: `${file.name} couldn't be uploaded. Try again.` }
	}
}

/** "Upload new version" from a file's page. */
export async function uploadVersionAction(formData: FormData): Promise<UploadActionResult> {
	const viewer = await requireLibraryUser()
	if (!viewer) return UNAUTHORIZED
	const file = formData.get("file")
	const fileId = Number(formData.get("fileId"))
	if (!(file instanceof File) || !Number.isInteger(fileId)) {
		return { success: false, error: "Choose a file." }
	}
	try {
		const bytes = new Uint8Array(await file.arrayBuffer())
		const result = await uploadVersion(db, getLibraryStorage(), viewer, {
			fileId,
			name: file.name,
			bytes,
		})
		if (result.ok) scheduleIndexing(result.data.versionId, result.data.name, bytes)
		return toActionResult(result)
	} catch (error) {
		console.error("Library version upload failed:", error)
		return { success: false, error: `${file.name} couldn't be uploaded. Try again.` }
	}
}

export async function getDownloadUrlAction(
	versionId: number,
	preview = false,
): Promise<ActionResult<{ url: string; inline: boolean }>> {
	const viewer = await requireLibraryUser()
	if (!viewer) return UNAUTHORIZED
	try {
		return toActionResult(
			await getDownloadUrl(db, getLibraryStorage(), viewer, versionId, { preview }),
		)
	} catch (error) {
		console.error("Library download link failed:", error)
		return { success: false, error: "The file couldn't be opened. Try again." }
	}
}

export async function createFolderAction(
	parentId: number | null,
	name: string,
): Promise<ActionResult<{ id: number; name: string }>> {
	const viewer = await requireLibraryUser()
	if (!viewer) return UNAUTHORIZED
	try {
		return toActionResult(await createFolder(db, viewer, { parentId, name }))
	} catch (error) {
		console.error("Library folder creation failed:", error)
		return { success: false, error: "The folder couldn't be created. Try again." }
	}
}

// ---------- Document admin actions (the service refuses board members) ----------

type Run<T> = (
	viewer: NonNullable<Awaited<ReturnType<typeof requireLibraryUser>>>,
) => Promise<LibraryResult<T>>

async function asLibraryUser<T>(what: string, run: Run<T>): Promise<ActionResult<T>> {
	const viewer = await requireLibraryUser()
	if (!viewer) return UNAUTHORIZED
	try {
		return toActionResult(await run(viewer))
	} catch (error) {
		console.error(`Library ${what} failed:`, error)
		return { success: false, error: `Couldn't ${what}. Try again.` }
	}
}

export async function renameFolderAction(folderId: number, name: string) {
	return asLibraryUser("rename the folder", (v) => renameFolder(db, v, folderId, name))
}

export async function moveFolderAction(folderId: number, targetParentId: number | null) {
	return asLibraryUser("move the folder", (v) => moveFolder(db, v, folderId, targetParentId))
}

export async function getFolderAccessAction(folderId: number): Promise<ActionResult<FolderAccess>> {
	return asLibraryUser("load folder access", (v) => getFolderAccess(db, v, folderId))
}

export async function setFolderRestrictionAction(
	folderId: number,
	restricted: boolean,
	memberIds: string[],
) {
	return asLibraryUser("change folder access", (v) =>
		setFolderRestriction(db, v, folderId, { restricted, memberIds }),
	)
}

export async function deleteFolderAction(folderId: number) {
	return asLibraryUser("delete the folder", (v) => deleteFolder(db, v, folderId))
}

export async function renameFileAction(fileId: number, name: string) {
	return asLibraryUser("rename the file", (v) => renameFile(db, v, fileId, name))
}

export async function moveFileAction(fileId: number, targetFolderId: number) {
	return asLibraryUser("move the file", (v) => moveFile(db, v, fileId, targetFolderId))
}

export async function deleteFileAction(fileId: number) {
	return asLibraryUser("delete the file", (v) => deleteFile(db, v, fileId))
}

export async function restoreVersionAction(fileId: number, versionId: number) {
	return asLibraryUser("restore that version", (v) => restoreVersion(db, v, fileId, versionId))
}

export async function restoreFromTrashAction(
	kind: "folder" | "file",
	id: number,
	target?: number | null,
) {
	return asLibraryUser("restore it", (v) => restoreFromTrash(db, v, { kind, id }, target))
}
