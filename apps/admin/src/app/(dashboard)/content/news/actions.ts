"use server"

import { announcement } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

interface AnnouncementInput {
	id?: number
	title: string
	text: string
	createDate: string
	externalUrl?: string
	externalName?: string
}

export interface AnnouncementData {
	id: number
	title: string
	text: string
	createDate: string
	externalUrl: string
	externalName: string
}

export async function listAnnouncementsAction(): Promise<ActionResult<AnnouncementData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: announcement.id,
				title: announcement.title,
				text: announcement.text,
				createDate: announcement.createDate,
				externalUrl: announcement.externalUrl,
				externalName: announcement.externalName,
			})
			.from(announcement)
			.orderBy(desc(announcement.createDate))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list announcements:", error)
		return { success: false, error: "Failed to list announcements" }
	}
}

export async function getAnnouncementAction(id: number): Promise<ActionResult<AnnouncementData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: announcement.id,
				title: announcement.title,
				text: announcement.text,
				createDate: announcement.createDate,
				externalUrl: announcement.externalUrl,
				externalName: announcement.externalName,
			})
			.from(announcement)
			.where(eq(announcement.id, id))

		if (results.length === 0) {
			return { success: false, error: "Announcement not found" }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get announcement:", error)
		return { success: false, error: "Failed to get announcement" }
	}
}

export async function saveAnnouncementAction(
	data: AnnouncementInput,
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const title = data.title?.trim()
	const text = data.text?.trim()

	if (!title) {
		return { success: false, error: "Title is required" }
	}

	if (!text) {
		return { success: false, error: "Text is required" }
	}

	try {
		if (data.id !== undefined) {
			await db
				.update(announcement)
				.set({
					title,
					text,
					createDate: data.createDate,
					externalUrl: data.externalUrl ?? "",
					externalName: data.externalName ?? "",
				})
				.where(eq(announcement.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(announcement).values({
				title,
				text,
				createDate: data.createDate,
				externalUrl: data.externalUrl ?? "",
				externalName: data.externalName ?? "",
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save announcement:", error)
		return { success: false, error: "Failed to save announcement" }
	}
}

export async function deleteAnnouncementAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(announcement).where(eq(announcement.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete announcement:", error)
		return { success: false, error: "Failed to delete announcement" }
	}
}
