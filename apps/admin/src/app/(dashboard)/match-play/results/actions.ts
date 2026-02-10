"use server"

import { club, matchPlayResult, team } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { aliasedTable, and, asc, eq, gte, lt } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

interface ResultInput {
	id?: number
	groupName: string
	matchDate: string
	homeTeamId: number
	awayTeamId: number
	homeTeamScore: string
	awayTeamScore: string
	forfeit: boolean
	enteredBy: string
	notes?: string | null
}

export interface ResultData {
	id: number
	year: number
	groupName: string
	matchDate: string
	homeTeamId: number
	homeClubName: string
	homeTeamScore: string
	awayTeamId: number
	awayClubName: string
	awayTeamScore: string
	forfeit: boolean
	enteredBy: string
	notes: string | null
}

export interface TeamOption {
	id: number
	clubName: string
	groupName: string
}

export async function listResultsAction(year: number): Promise<ActionResult<ResultData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const homeTeam = aliasedTable(team, "homeTeam")
	const awayTeam = aliasedTable(team, "awayTeam")
	const homeClub = aliasedTable(club, "homeClub")
	const awayClub = aliasedTable(club, "awayClub")

	try {
		const results = await db
			.select({
				id: matchPlayResult.id,
				year: homeTeam.year,
				groupName: matchPlayResult.groupName,
				matchDate: matchPlayResult.matchDate,
				homeTeamId: matchPlayResult.homeTeamId,
				homeClubName: homeClub.name,
				homeTeamScore: matchPlayResult.homeTeamScore,
				awayTeamId: matchPlayResult.awayTeamId,
				awayClubName: awayClub.name,
				awayTeamScore: matchPlayResult.awayTeamScore,
				forfeit: matchPlayResult.forfeit,
				enteredBy: matchPlayResult.enteredBy,
				notes: matchPlayResult.notes,
			})
			.from(matchPlayResult)
			.innerJoin(homeTeam, eq(matchPlayResult.homeTeamId, homeTeam.id))
			.innerJoin(awayTeam, eq(matchPlayResult.awayTeamId, awayTeam.id))
			.innerJoin(homeClub, eq(homeTeam.clubId, homeClub.id))
			.innerJoin(awayClub, eq(awayTeam.clubId, awayClub.id))
			.where(
				and(
					gte(matchPlayResult.matchDate, `${year}-01-01`),
					lt(matchPlayResult.matchDate, `${year + 1}-01-01`),
				),
			)
			.orderBy(asc(matchPlayResult.groupName), asc(matchPlayResult.matchDate))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list results:", error)
		return { success: false, error: "Failed to list results" }
	}
}

export async function getResultAction(id: number): Promise<ActionResult<ResultData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const homeTeam = aliasedTable(team, "homeTeam")
	const awayTeam = aliasedTable(team, "awayTeam")
	const homeClub = aliasedTable(club, "homeClub")
	const awayClub = aliasedTable(club, "awayClub")

	try {
		const results = await db
			.select({
				id: matchPlayResult.id,
				year: homeTeam.year,
				groupName: matchPlayResult.groupName,
				matchDate: matchPlayResult.matchDate,
				homeTeamId: matchPlayResult.homeTeamId,
				homeClubName: homeClub.name,
				homeTeamScore: matchPlayResult.homeTeamScore,
				awayTeamId: matchPlayResult.awayTeamId,
				awayClubName: awayClub.name,
				awayTeamScore: matchPlayResult.awayTeamScore,
				forfeit: matchPlayResult.forfeit,
				enteredBy: matchPlayResult.enteredBy,
				notes: matchPlayResult.notes,
			})
			.from(matchPlayResult)
			.innerJoin(homeTeam, eq(matchPlayResult.homeTeamId, homeTeam.id))
			.innerJoin(awayTeam, eq(matchPlayResult.awayTeamId, awayTeam.id))
			.innerJoin(homeClub, eq(homeTeam.clubId, homeClub.id))
			.innerJoin(awayClub, eq(awayTeam.clubId, awayClub.id))
			.where(eq(matchPlayResult.id, id))

		if (results.length === 0) {
			return { success: false, error: "Result not found" }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get result:", error)
		return { success: false, error: "Failed to get result" }
	}
}

export async function saveResultAction(data: ResultInput): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const groupName = data.groupName?.trim()

	if (!groupName) {
		return { success: false, error: "Group name is required" }
	}

	if (!data.homeTeamId || !data.awayTeamId) {
		return { success: false, error: "Home and away teams are required" }
	}

	if (data.homeTeamId === data.awayTeamId) {
		return { success: false, error: "Home and away teams must be different" }
	}

	try {
		if (data.id !== undefined) {
			await db
				.update(matchPlayResult)
				.set({
					groupName,
					matchDate: data.matchDate,
					homeTeamId: data.homeTeamId,
					awayTeamId: data.awayTeamId,
					homeTeamScore: data.homeTeamScore,
					awayTeamScore: data.awayTeamScore,
					forfeit: data.forfeit,
					enteredBy: data.enteredBy,
					notes: data.notes ?? null,
				})
				.where(eq(matchPlayResult.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(matchPlayResult).values({
				groupName,
				matchDate: data.matchDate,
				homeTeamId: data.homeTeamId,
				awayTeamId: data.awayTeamId,
				homeTeamScore: data.homeTeamScore,
				awayTeamScore: data.awayTeamScore,
				forfeit: data.forfeit,
				enteredBy: data.enteredBy,
				notes: data.notes ?? null,
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save result:", error)
		return { success: false, error: "Failed to save result" }
	}
}

export async function deleteResultAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(matchPlayResult).where(eq(matchPlayResult.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete result:", error)
		return { success: false, error: "Failed to delete result" }
	}
}

export async function listTeamOptionsAction(year: number): Promise<ActionResult<TeamOption[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: team.id,
				clubName: club.name,
				groupName: team.groupName,
			})
			.from(team)
			.innerJoin(club, eq(team.clubId, club.id))
			.where(eq(team.year, year))
			.orderBy(asc(team.groupName), asc(club.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list team options:", error)
		return { success: false, error: "Failed to list team options" }
	}
}
