"use server"

import { document, tournament } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import {
	deleteDocument,
	type DocumentDataFull,
	saveDocument,
	type SaveDocumentInput,
	uploadDocumentFile,
} from "@/lib/documents"
import { requireAuth } from "@/lib/require-auth"

// ── Types ───────────────────────────────────────────────────────────

export interface TournamentOption {
	id: number
	name: string
}

// ── List All Documents ──────────────────────────────────────────────

export async function listAllDocumentsAction(): Promise<ActionResult<DocumentDataFull[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: document.id,
				title: document.title,
				documentType: document.documentType,
				file: document.file,
				year: document.year,
				tournamentId: document.tournamentId,
				tournamentName: tournament.name,
				lastUpdate: document.lastUpdate,
				createdBy: document.createdBy,
			})
			.from(document)
			.leftJoin(tournament, eq(document.tournamentId, tournament.id))
			.orderBy(asc(document.title))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list documents:", error)
		return { success: false, error: "Failed to list documents" }
	}
}

// ── Get Single Document ─────────────────────────────────────────────

export async function getDocumentAction(id: number): Promise<ActionResult<DocumentDataFull>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: document.id,
				title: document.title,
				documentType: document.documentType,
				file: document.file,
				year: document.year,
				tournamentId: document.tournamentId,
				tournamentName: tournament.name,
				lastUpdate: document.lastUpdate,
				createdBy: document.createdBy,
			})
			.from(document)
			.leftJoin(tournament, eq(document.tournamentId, tournament.id))
			.where(eq(document.id, id))

		const row = results[0]
		if (!row) {
			return { success: false, error: "Document not found" }
		}

		return { success: true, data: row }
	} catch (error) {
		console.error("Failed to get document:", error)
		return { success: false, error: "Failed to get document" }
	}
}

// ── Save Document ───────────────────────────────────────────────────

export async function saveDocumentAction(
	data: SaveDocumentInput,
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
		return { success: true, data: { id } }
	} catch (error) {
		console.error("Failed to save document:", error)
		return { success: false, error: "Failed to save document" }
	}
}

// ── Delete Document ─────────────────────────────────────────────────

export async function deleteDocumentAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await deleteDocument(id)
		return { success: true }
	} catch (error) {
		console.error("Failed to delete document:", error)
		return { success: false, error: "Failed to delete document" }
	}
}

// ── Upload File ─────────────────────────────────────────────────────

export async function uploadDocumentFileAction(
	formData: FormData,
): Promise<ActionResult<{ file: string }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const file = formData.get("file") as File | null
	const documentId = formData.get("documentId") as string | null

	if (!file || !documentId) {
		return { success: false, error: "File and document ID are required" }
	}

	const docId = parseInt(documentId, 10)
	if (isNaN(docId)) {
		return { success: false, error: "Invalid document ID" }
	}

	try {
		const key = await uploadDocumentFile(file, docId)
		return { success: true, data: { file: key } }
	} catch (error) {
		console.error("Failed to upload document file:", error)
		return { success: false, error: "Failed to upload file" }
	}
}

// ── Tournament Options ──────────────────────────────────────────────

export async function listTournamentOptionsAction(): Promise<ActionResult<TournamentOption[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: tournament.id,
				name: tournament.name,
			})
			.from(tournament)
			.orderBy(asc(tournament.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list tournaments:", error)
		return { success: false, error: "Failed to list tournaments" }
	}
}
