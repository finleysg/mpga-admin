"use server"

import {
	document,
	golfCourse,
	tournament,
	tournamentInstance,
	tournamentLink,
} from "@mpga/database"
import { and, asc, eq, like } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { uploadToS3 } from "@/lib/s3"

export interface ActionResult<T = void> {
	success: boolean
	error?: string
	data?: T
}

// ---------- Tournament Instance ----------

export interface TournamentInstanceData {
	id: number
	name: string
	description: string
	startDate: string
	rounds: number
	registrationStart: string | null
	registrationEnd: string | null
	locationId: number
	tournamentId: number
	tournamentName: string
	tournamentSystemName: string
}

export async function getTournamentInstanceAction(
	systemName: string,
): Promise<ActionResult<TournamentInstanceData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const currentYear = new Date().getFullYear()
		const results = await db
			.select({
				id: tournamentInstance.id,
				name: tournamentInstance.name,
				description: tournamentInstance.description,
				startDate: tournamentInstance.startDate,
				rounds: tournamentInstance.rounds,
				registrationStart: tournamentInstance.registrationStart,
				registrationEnd: tournamentInstance.registrationEnd,
				locationId: tournamentInstance.locationId,
				tournamentId: tournament.id,
				tournamentName: tournament.name,
				tournamentSystemName: tournament.systemName,
			})
			.from(tournamentInstance)
			.innerJoin(tournament, eq(tournamentInstance.tournamentId, tournament.id))
			.where(
				and(
					eq(tournament.systemName, systemName),
					like(tournamentInstance.startDate, `${currentYear}-%`),
				),
			)

		if (results.length === 0) {
			return { success: false, error: "No tournament instance found for this year" }
		}

		const row = results[0]!
		return {
			success: true,
			data: {
				...row,
				tournamentId: row.tournamentId!,
				tournamentSystemName: row.tournamentSystemName!,
			},
		}
	} catch (error) {
		console.error("Failed to get tournament instance:", error)
		return { success: false, error: "Failed to get tournament instance" }
	}
}

// ---------- Golf Courses ----------

export interface GolfCourseOption {
	id: number
	name: string
	city: string
	state: string
}

export async function listGolfCoursesAction(): Promise<ActionResult<GolfCourseOption[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: golfCourse.id,
				name: golfCourse.name,
				city: golfCourse.city,
				state: golfCourse.state,
			})
			.from(golfCourse)
			.orderBy(asc(golfCourse.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list golf courses:", error)
		return { success: false, error: "Failed to list golf courses" }
	}
}

// ---------- Save Instance ----------

interface SaveInstanceInput {
	id: number
	name: string
	startDate: string
	rounds: number
	registrationStart: string | null
	registrationEnd: string | null
	locationId: number
}

export async function saveTournamentInstanceAction(
	data: SaveInstanceInput,
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	if (!data.name.trim()) {
		return { success: false, error: "Name is required" }
	}

	if (data.rounds < 1) {
		return { success: false, error: "Rounds must be at least 1" }
	}

	try {
		await db
			.update(tournamentInstance)
			.set({
				name: data.name.trim(),
				startDate: data.startDate,
				rounds: data.rounds,
				registrationStart: data.registrationStart,
				registrationEnd: data.registrationEnd,
				locationId: data.locationId,
			})
			.where(eq(tournamentInstance.id, data.id))

		return { success: true, data: { id: data.id } }
	} catch (error) {
		console.error("Failed to save tournament instance:", error)
		return { success: false, error: "Failed to save tournament instance" }
	}
}

// ---------- Tournament Links ----------

export interface TournamentLinkData {
	id: number
	title: string
	url: string
	linkType: string
	tournamentInstanceId: number
}

export async function listTournamentLinksAction(
	instanceId: number,
): Promise<ActionResult<TournamentLinkData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: tournamentLink.id,
				title: tournamentLink.title,
				url: tournamentLink.url,
				linkType: tournamentLink.linkType,
				tournamentInstanceId: tournamentLink.tournamentInstanceId,
			})
			.from(tournamentLink)
			.where(eq(tournamentLink.tournamentInstanceId, instanceId))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list tournament links:", error)
		return { success: false, error: "Failed to list tournament links" }
	}
}

interface SaveLinkInput {
	id?: number
	title: string
	url: string
	linkType: string
	tournamentInstanceId: number
}

export async function saveTournamentLinkAction(
	data: SaveLinkInput,
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	if (!data.title.trim() || !data.url.trim()) {
		return { success: false, error: "Title and URL are required" }
	}

	try {
		if (data.id !== undefined) {
			await db
				.update(tournamentLink)
				.set({
					title: data.title.trim(),
					url: data.url.trim(),
					linkType: data.linkType,
				})
				.where(eq(tournamentLink.id, data.id))
			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(tournamentLink).values({
				title: data.title.trim(),
				url: data.url.trim(),
				linkType: data.linkType,
				tournamentInstanceId: data.tournamentInstanceId,
			})
			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save tournament link:", error)
		return { success: false, error: "Failed to save tournament link" }
	}
}

export async function deleteTournamentLinkAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(tournamentLink).where(eq(tournamentLink.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete tournament link:", error)
		return { success: false, error: "Failed to delete tournament link" }
	}
}

// ---------- Documents ----------

export interface DocumentData {
	id: number
	title: string
	documentType: string
	file: string | null
	year: number | null
	tournamentId: number | null
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
		const results = await db
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

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list documents:", error)
		return { success: false, error: "Failed to list documents" }
	}
}

interface SaveDocumentInput {
	id?: number
	title: string
	documentType: string
	tournamentId: number
	year: number
}

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
				})
				.where(eq(document.id, data.id))
			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(document).values({
				title: data.title.trim(),
				documentType: data.documentType,
				tournamentId: data.tournamentId,
				year: data.year,
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

export async function deleteDocumentAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(document).where(eq(document.id, id))
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
