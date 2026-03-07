"use server"

import { matchPlayGroup } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

interface GroupData {
	id: number
	year: number
	groupName: string
}

export async function listGroupsAction(year: number): Promise<ActionResult<GroupData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: matchPlayGroup.id,
				year: matchPlayGroup.year,
				groupName: matchPlayGroup.groupName,
			})
			.from(matchPlayGroup)
			.where(eq(matchPlayGroup.year, year))
			.orderBy(asc(matchPlayGroup.groupName))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list groups:", error)
		return { success: false, error: "Failed to list groups" }
	}
}

export async function addGroupAction(
	year: number,
	name: string,
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const groupName = name.trim()
	if (!groupName) {
		return { success: false, error: "Group name is required" }
	}

	try {
		const result = await db.insert(matchPlayGroup).values({ year, groupName })
		return { success: true, data: { id: result[0].insertId } }
	} catch (error) {
		console.error("Failed to add group:", error)
		if (error instanceof Error && error.message.includes("Duplicate")) {
			return { success: false, error: `Group "${groupName}" already exists for ${year}` }
		}
		return { success: false, error: "Failed to add group" }
	}
}

export async function deleteGroupAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(matchPlayGroup).where(eq(matchPlayGroup.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete group:", error)
		return { success: false, error: "Failed to delete group" }
	}
}

export async function updateGroupAction(id: number, name: string): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const groupName = name.trim()
	if (!groupName) {
		return { success: false, error: "Group name is required" }
	}

	try {
		await db.update(matchPlayGroup).set({ groupName }).where(eq(matchPlayGroup.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to update group:", error)
		if (error instanceof Error && error.message.includes("Duplicate")) {
			return { success: false, error: `Group "${groupName}" already exists` }
		}
		return { success: false, error: "Failed to update group" }
	}
}

export async function copyGroupsAction(
	fromYear: number,
	toYear: number,
): Promise<ActionResult<{ count: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const sourceGroups = await db
			.select({ groupName: matchPlayGroup.groupName })
			.from(matchPlayGroup)
			.where(eq(matchPlayGroup.year, fromYear))

		if (sourceGroups.length === 0) {
			return { success: false, error: `No groups found for ${fromYear}` }
		}

		let count = 0
		for (const group of sourceGroups) {
			try {
				await db.insert(matchPlayGroup).values({ year: toYear, groupName: group.groupName })
				count++
			} catch {
				// Skip duplicates
			}
		}

		return { success: true, data: { count } }
	} catch (error) {
		console.error("Failed to copy groups:", error)
		return { success: false, error: "Failed to copy groups" }
	}
}
