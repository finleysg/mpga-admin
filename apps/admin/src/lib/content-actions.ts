"use server"

import { content } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { revalidatePublicSite } from "@/lib/revalidate"

export interface ContentData {
	id: number
	systemName: string
	title: string
	contentText: string
}

export async function getContentAction(systemName: string): Promise<ActionResult<ContentData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: content.id,
				systemName: content.systemName,
				title: content.title,
				contentText: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, systemName))

		if (results.length === 0) {
			return { success: true }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get content:", error)
		return { success: false, error: "Failed to get content" }
	}
}

export async function saveContentAction(
	data: {
		id?: number
		systemName: string
		title: string
		contentText: string
	},
	revalidatePath: string,
	revalidateType?: "page" | "layout",
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const title = data.title?.trim()
	if (!title) {
		return { success: false, error: "Title is required" }
	}

	try {
		let id: number

		if (data.id !== undefined) {
			await db
				.update(content)
				.set({
					title,
					contentText: data.contentText,
				})
				.where(eq(content.id, data.id))
			id = data.id
		} else {
			const result = await db.insert(content).values({
				systemName: data.systemName,
				title,
				contentText: data.contentText,
			})
			id = result[0].insertId
		}

		await revalidatePublicSite(revalidatePath, revalidateType)

		return { success: true, data: { id } }
	} catch (error) {
		console.error("Failed to save content:", error)
		return { success: false, error: "Failed to save content" }
	}
}
