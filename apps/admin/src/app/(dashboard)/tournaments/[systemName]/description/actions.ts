"use server"

import { tournament, tournamentInstance } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { revalidatePublicSite } from "@/lib/revalidate"

export async function getInstanceDescriptionAction(
	systemName: string,
): Promise<ActionResult<{ id: number; title: string; description: string }>> {
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
			})
			.from(tournamentInstance)
			.innerJoin(tournament, eq(tournamentInstance.tournamentId, tournament.id))
			.where(eq(tournament.systemName, systemName))

		const filtered = results.filter((r) => r.startDate.startsWith(`${currentYear}`))

		if (filtered.length === 0) {
			return { success: false, error: "No tournament instance found for this year" }
		}

		const row = filtered[0]!
		return {
			success: true,
			data: { id: row.id, title: row.name, description: row.description },
		}
	} catch (error) {
		console.error("Failed to get instance description:", error)
		return { success: false, error: "Failed to get instance description" }
	}
}

export async function saveInstanceDescriptionAction(data: {
	instanceId: number
	description: string
	systemName: string
}): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db
			.update(tournamentInstance)
			.set({ description: data.description })
			.where(eq(tournamentInstance.id, data.instanceId))

		await revalidatePublicSite(`/tournaments/${data.systemName}/${new Date().getFullYear()}`)

		return { success: true, data: { id: data.instanceId } }
	} catch (error) {
		console.error("Failed to save instance description:", error)
		return { success: false, error: "Failed to save instance description" }
	}
}
