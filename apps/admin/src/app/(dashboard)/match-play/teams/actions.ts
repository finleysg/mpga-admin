"use server"

import { club, team } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

interface TeamInput {
	id?: number
	year: number
	groupName: string
	isSenior: boolean
	clubId: number
	notes?: string | null
}

export interface TeamData {
	id: number
	year: number
	groupName: string
	isSenior: boolean
	clubId: number
	clubName: string
	notes: string | null
}

export interface ClubOption {
	id: number
	name: string
}

export async function listTeamsAction(year: number): Promise<ActionResult<TeamData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: team.id,
				year: team.year,
				groupName: team.groupName,
				isSenior: team.isSenior,
				clubId: team.clubId,
				clubName: club.name,
				notes: team.notes,
			})
			.from(team)
			.innerJoin(club, eq(team.clubId, club.id))
			.where(eq(team.year, year))
			.orderBy(asc(team.groupName), asc(club.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list teams:", error)
		return { success: false, error: "Failed to list teams" }
	}
}

export async function getTeamAction(id: number): Promise<ActionResult<TeamData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: team.id,
				year: team.year,
				groupName: team.groupName,
				isSenior: team.isSenior,
				clubId: team.clubId,
				clubName: club.name,
				notes: team.notes,
			})
			.from(team)
			.innerJoin(club, eq(team.clubId, club.id))
			.where(eq(team.id, id))

		if (results.length === 0) {
			return { success: false, error: "Team not found" }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get team:", error)
		return { success: false, error: "Failed to get team" }
	}
}

export async function saveTeamAction(data: TeamInput): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const groupName = data.groupName?.trim()

	if (!groupName) {
		return { success: false, error: "Group name is required" }
	}

	if (!data.clubId) {
		return { success: false, error: "Club is required" }
	}

	try {
		if (data.id !== undefined) {
			await db
				.update(team)
				.set({
					year: data.year,
					groupName,
					isSenior: data.isSenior,
					clubId: data.clubId,
					notes: data.notes ?? null,
				})
				.where(eq(team.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(team).values({
				year: data.year,
				groupName,
				isSenior: data.isSenior,
				clubId: data.clubId,
				notes: data.notes ?? null,
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save team:", error)
		return { success: false, error: "Failed to save team" }
	}
}

export async function deleteTeamAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(team).where(eq(team.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete team:", error)

		if (error instanceof Error && error.message.includes("foreign key constraint")) {
			return {
				success: false,
				error: "Cannot delete: this team has match play results",
			}
		}

		return { success: false, error: "Failed to delete team" }
	}
}

export async function listClubOptionsAction(): Promise<ActionResult<ClubOption[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: club.id,
				name: club.name,
			})
			.from(club)
			.where(eq(club.archived, false))
			.orderBy(asc(club.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list clubs:", error)
		return { success: false, error: "Failed to list clubs" }
	}
}
