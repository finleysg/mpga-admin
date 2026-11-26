"use server"

import type { ActionResult } from "@mpga/types"

import { db } from "@/lib/db"
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
		return toActionResult(
			await uploadVersion(db, getLibraryStorage(), viewer, { fileId, name: file.name, bytes }),
		)
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
