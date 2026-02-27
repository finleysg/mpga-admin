"use server"

import type { ActionResult } from "@mpga/types"

import {
	deletePhoto,
	listPhotos,
	type PhotoData,
	savePhoto,
	type SavePhotoInput,
	uploadPhotoImage,
} from "@/lib/photos"
import { requireAuth } from "@/lib/require-auth"
import { revalidatePublicSite } from "@/lib/revalidate"

function revalidateTournamentYearPage(systemName: string) {
	return revalidatePublicSite(`/tournaments/${systemName}/${new Date().getFullYear()}`)
}

export async function listPhotosAction(tournamentId: number): Promise<ActionResult<PhotoData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const data = await listPhotos(tournamentId)
		return { success: true, data }
	} catch (error) {
		console.error("Failed to list photos:", error)
		return { success: false, error: "Failed to list photos" }
	}
}

export async function savePhotoAction(
	data: SavePhotoInput & { systemName: string },
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	if (!data.caption.trim()) {
		return { success: false, error: "Caption is required" }
	}

	try {
		const id = await savePhoto(data, userId)
		await revalidateTournamentYearPage(data.systemName)
		return { success: true, data: { id } }
	} catch (error) {
		console.error("Failed to save photo:", error)
		return { success: false, error: "Failed to save photo" }
	}
}

export async function deletePhotoAction(id: number, systemName: string): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await deletePhoto(id)
		await revalidateTournamentYearPage(systemName)
		return { success: true }
	} catch (error) {
		console.error("Failed to delete photo:", error)
		return { success: false, error: "Failed to delete photo" }
	}
}

export async function uploadPhotoImageAction(
	formData: FormData,
): Promise<ActionResult<{ rawImage: string }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const file = formData.get("file") as File | null
	const photoId = formData.get("photoId") as string | null
	const year = formData.get("year") as string | null
	const systemName = formData.get("systemName") as string | null

	if (!file || !photoId || !year) {
		return { success: false, error: "File, photo ID, and year are required" }
	}

	const id = parseInt(photoId, 10)
	const yr = parseInt(year, 10)
	if (isNaN(id) || isNaN(yr)) {
		return { success: false, error: "Invalid photo ID or year" }
	}

	try {
		const key = await uploadPhotoImage(file, id, yr)
		if (systemName) await revalidateTournamentYearPage(systemName)
		return { success: true, data: { rawImage: key } }
	} catch (error) {
		console.error("Failed to upload photo image:", error)
		return { success: false, error: "Failed to upload image" }
	}
}
