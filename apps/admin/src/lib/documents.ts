import { document, documentTag } from "@mpga/database"
import { and, eq } from "drizzle-orm"

import { db } from "./db"
import { deleteFromS3, uploadToS3 } from "./s3"

export interface DocumentData {
	id: number
	title: string
	documentType: string
	file: string | null
	year: number | null
	tournamentId: number | null
}

export interface DocumentDataFull extends DocumentData {
	tournamentName: string | null
	lastUpdate: string
	createdBy: string
}

export interface SaveDocumentInput {
	id?: number
	title: string
	documentType: string
	year: number | null
	tournamentId: number | null
}

export async function listDocuments(tournamentId: number, year: number): Promise<DocumentData[]> {
	return db
		.select({
			id: document.id,
			title: document.title,
			documentType: document.documentType,
			file: document.file,
			year: document.year,
			tournamentId: document.tournamentId,
		})
		.from(document)
		.where(and(eq(document.tournamentId, tournamentId), eq(document.year, year)))
}

export async function saveDocument(data: SaveDocumentInput, userId: string): Promise<number> {
	const now = new Date().toISOString().replace("T", " ").replace("Z", "")

	if (data.id !== undefined) {
		await db
			.update(document)
			.set({
				title: data.title.trim(),
				documentType: data.documentType,
				year: data.year,
				tournamentId: data.tournamentId,
				lastUpdate: now,
			})
			.where(eq(document.id, data.id))
		return data.id
	}

	const result = await db.insert(document).values({
		title: data.title.trim(),
		documentType: data.documentType,
		year: data.year,
		tournamentId: data.tournamentId,
		lastUpdate: now,
		createdBy: userId,
	})
	return result[0].insertId
}

export async function uploadDocumentFile(file: File, documentId: number): Promise<string> {
	const buffer = Buffer.from(await file.arrayBuffer())
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
	const key = `documents/${Date.now()}-${safeName}`
	await uploadToS3(buffer, key, file.type)

	const now = new Date().toISOString().replace("T", " ").replace("Z", "")
	await db.update(document).set({ file: key, lastUpdate: now }).where(eq(document.id, documentId))

	return key
}

export async function deleteDocument(id: number): Promise<void> {
	const [doc] = await db.select({ file: document.file }).from(document).where(eq(document.id, id))
	if (doc?.file) {
		try {
			await deleteFromS3(doc.file)
		} catch (err) {
			console.warn("Failed to delete S3 object for document:", err)
		}
	}

	await db.transaction(async (tx) => {
		await tx.delete(documentTag).where(eq(documentTag.documentId, id))
		await tx.delete(document).where(eq(document.id, id))
	})
}
