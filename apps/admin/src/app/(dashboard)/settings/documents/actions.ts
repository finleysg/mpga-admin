"use server"

import { document, documentTag, tournament } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { uploadToS3 } from "@/lib/s3"

// ── Types ───────────────────────────────────────────────────────────

export interface DocumentData {
	id: number
	title: string
	documentType: string
	file: string | null
	year: number | null
	tournamentId: number | null
	tournamentName: string | null
	lastUpdate: string
	createdBy: string
}

export interface TournamentOption {
	id: number
	name: string
}

interface SaveDocumentInput {
	id?: number
	title: string
	documentType: string
	year: number | null
	tournamentId: number | null
}

// ── List All Documents ──────────────────────────────────────────────

export async function listAllDocumentsAction(): Promise<ActionResult<DocumentData[]>> {
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

export async function getDocumentAction(id: number): Promise<ActionResult<DocumentData>> {
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
		if (data.id !== undefined) {
			await db
				.update(document)
				.set({
					title: data.title.trim(),
					documentType: data.documentType,
					year: data.year,
					tournamentId: data.tournamentId,
					lastUpdate: new Date().toISOString().replace("T", " ").replace("Z", ""),
				})
				.where(eq(document.id, data.id))
			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(document).values({
				title: data.title.trim(),
				documentType: data.documentType,
				year: data.year,
				tournamentId: data.tournamentId,
				lastUpdate: new Date().toISOString().replace("T", " ").replace("Z", ""),
				createdBy: userId,
			})
			return { success: true, data: { id: result[0].insertId } }
		}
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
		await db.transaction(async (tx) => {
			await tx.delete(documentTag).where(eq(documentTag.documentId, id))
			await tx.delete(document).where(eq(document.id, id))
		})
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

	try {
		const buffer = Buffer.from(await file.arrayBuffer())
		const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
		const key = `documents/${Date.now()}-${safeName}`
		await uploadToS3(buffer, key, file.type)

		const docId = parseInt(documentId, 10)
		if (isNaN(docId)) {
			return { success: false, error: "Invalid document ID" }
		}

		await db
			.update(document)
			.set({
				file: key,
				lastUpdate: new Date().toISOString().replace("T", " ").replace("Z", ""),
			})
			.where(eq(document.id, docId))

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
