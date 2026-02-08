import { club, document, matchPlayResult, team } from "@mpga/database"
import { aliasedTable, and, asc, eq, gte, like, lt } from "drizzle-orm"

import { db } from "../db"

export interface MatchPlayTeam {
	id: number
	clubName: string
	groupName: string
	isSenior: boolean
}

export async function getTeamsForYear(year: number): Promise<MatchPlayTeam[]> {
	try {
		const results = await db
			.select({
				id: team.id,
				clubName: club.name,
				groupName: team.groupName,
				isSenior: team.isSenior,
			})
			.from(team)
			.innerJoin(club, eq(team.clubId, club.id))
			.where(eq(team.year, year))
			.orderBy(team.groupName, club.name)

		return results.map((r) => ({
			...r,
			isSenior: r.isSenior,
		}))
	} catch (error) {
		console.error("Failed to fetch match play teams:", error)
		return []
	}
}

export async function getMatchPlayDocuments(year: number) {
	try {
		const results = await db
			.select({
				id: document.id,
				title: document.title,
				file: document.file,
			})
			.from(document)
			.where(and(like(document.documentType, "Match Play%"), eq(document.year, year)))

		return results
	} catch (error) {
		console.error("Failed to fetch match play documents:", error)
		return []
	}
}

export async function getMatchPlayResults(year: number) {
	const homeTeam = aliasedTable(team, "homeTeam")
	const awayTeam = aliasedTable(team, "awayTeam")
	const homeClub = aliasedTable(club, "homeClub")
	const awayClub = aliasedTable(club, "awayClub")

	try {
		const results = await db
			.select({
				id: matchPlayResult.id,
				groupName: matchPlayResult.groupName,
				matchDate: matchPlayResult.matchDate,
				homeClubName: homeClub.name,
				homeTeamScore: matchPlayResult.homeTeamScore,
				awayClubName: awayClub.name,
				awayTeamScore: matchPlayResult.awayTeamScore,
				forfeit: matchPlayResult.forfeit,
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

		return results
	} catch (error) {
		console.error("Failed to fetch match play results:", error)
		return []
	}
}
