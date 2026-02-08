"use server"

import { tournament } from "@mpga/database"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

interface ActionResult<T = void> {
	success: boolean
	error?: string
	data?: T
}

export async function getTournamentDescriptionAction(
	systemName: string,
): Promise<ActionResult<{ id: number; title: string; description: string }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: tournament.id,
				name: tournament.name,
				description: tournament.description,
			})
			.from(tournament)
			.where(eq(tournament.systemName, systemName))

		if (results.length === 0) {
			return { success: false, error: "Tournament not found" }
		}

		const row = results[0]!
		return { success: true, data: { id: row.id, title: row.name, description: row.description } }
	} catch (error) {
		console.error("Failed to get tournament description:", error)
		return { success: false, error: "Failed to get tournament description" }
	}
}

export async function saveTournamentDescriptionAction(data: {
	tournamentId: number
	description: string
}): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db
			.update(tournament)
			.set({ description: data.description })
			.where(eq(tournament.id, data.tournamentId))

		return { success: true, data: { id: data.tournamentId } }
	} catch (error) {
		console.error("Failed to save tournament description:", error)
		return { success: false, error: "Failed to save tournament description" }
	}
}
