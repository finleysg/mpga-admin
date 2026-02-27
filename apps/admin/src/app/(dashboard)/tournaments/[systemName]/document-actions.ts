"use server"

import type { ActionResult } from "@mpga/types"

import {
	deleteDocument,
	listDocuments,
	type DocumentData,
	saveDocument,
	type SaveDocumentInput,
	uploadDocumentFile,
} from "@/lib/documents"
import { requireAuth } from "@/lib/require-auth"
import { revalidatePublicSite } from "@/lib/revalidate"

function revalidateTournamentYearPage(systemName: string) {
	return revalidatePublicSite(`/tournaments/${systemName}/${new Date().getFullYear()}`)
}

export async function listDocumentsAction(
	tournamentId: number,
	year: number,
): Promise<ActionResult<DocumentData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const data = await listDocuments(tournamentId, year)
		return { success: true, data }
	} catch (error) {
		console.error("Failed to list documents:", error)
		return { success: false, error: "Failed to list documents" }
	}
}

export async function saveDocumentAction(
	data: SaveDocumentInput & { systemName: string },
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	if (!data.title.trim()) {
		return { success: false, error: "Title is required" }
	}

	try {
		const id = await saveDocument(data, userId)
		await revalidateTournamentYearPage(data.systemName)
		return { success: true, data: { id } }
	} catch (error) {
		console.error("Failed to save document:", error)
		return { success: false, error: "Failed to save document" }
	}
}

export async function deleteDocumentAction(id: number, systemName: string): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await deleteDocument(id)
		await revalidateTournamentYearPage(systemName)
		return { success: true }
	} catch (error) {
		console.error("Failed to delete document:", error)
		return { success: false, error: "Failed to delete document" }
	}
}

export async function uploadDocumentFileAction(
	formData: FormData,
): Promise<ActionResult<{ file: string }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const file = formData.get("file") as File | null
	const documentId = formData.get("documentId") as string | null
	const systemName = formData.get("systemName") as string | null

	if (!file || !documentId) {
		return { success: false, error: "File and document ID are required" }
	}

	const docId = parseInt(documentId, 10)
	if (isNaN(docId)) {
		return { success: false, error: "Invalid document ID" }
	}

	try {
		const key = await uploadDocumentFile(file, docId)
		if (systemName) await revalidateTournamentYearPage(systemName)
		return { success: true, data: { file: key } }
	} catch (error) {
		console.error("Failed to upload document file:", error)
		return { success: false, error: "Failed to upload file" }
	}
}
