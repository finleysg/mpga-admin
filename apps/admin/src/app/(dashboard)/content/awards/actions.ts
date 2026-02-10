"use server"

import { award, awardWinner } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

export interface AwardData {
	id: number
	name: string
	description: string
}

export interface AwardWinnerData {
	id: number
	year: number
	winner: string
	notes: string | null
	awardId: number
}

export async function getAwardAction(id: number): Promise<ActionResult<AwardData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: award.id,
				name: award.name,
				description: award.description,
			})
			.from(award)
			.where(eq(award.id, id))

		if (results.length === 0) {
			return { success: false, error: "Award not found" }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get award:", error)
		return { success: false, error: "Failed to get award" }
	}
}

export async function saveAwardDescriptionAction(data: {
	id: number
	description: string
}): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.update(award).set({ description: data.description }).where(eq(award.id, data.id))

		return { success: true, data: { id: data.id } }
	} catch (error) {
		console.error("Failed to save award description:", error)
		return { success: false, error: "Failed to save award description" }
	}
}

export async function listAwardWinnersAction(
	awardId: number,
): Promise<ActionResult<AwardWinnerData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: awardWinner.id,
				year: awardWinner.year,
				winner: awardWinner.winner,
				notes: awardWinner.notes,
				awardId: awardWinner.awardId,
			})
			.from(awardWinner)
			.where(eq(awardWinner.awardId, awardId))
			.orderBy(desc(awardWinner.year))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list award winners:", error)
		return { success: false, error: "Failed to list award winners" }
	}
}

export async function saveAwardWinnerAction(data: {
	id?: number
	awardId: number
	year: number
	winner: string
	notes?: string | null
}): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const winner = data.winner?.trim()
	if (!winner) {
		return { success: false, error: "Winner name is required" }
	}

	try {
		if (data.id !== undefined) {
			await db
				.update(awardWinner)
				.set({
					year: data.year,
					winner,
					notes: data.notes ?? null,
				})
				.where(eq(awardWinner.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(awardWinner).values({
				awardId: data.awardId,
				year: data.year,
				winner,
				notes: data.notes ?? null,
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save award winner:", error)
		return { success: false, error: "Failed to save award winner" }
	}
}

export async function deleteAwardWinnerAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(awardWinner).where(eq(awardWinner.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete award winner:", error)
		return { success: false, error: "Failed to delete award winner" }
	}
}
