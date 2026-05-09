"use server"

import { club, contact, matchPlayResult, team, teamCaptain } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { aliasedTable, and, asc, eq, ne, or } from "drizzle-orm"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendCaptainNoteEmail } from "@/lib/email"

import type { CaptainResult, CaptainResultInput, CaptainTeam, OpponentOption } from "./types"
import { getCaptainTeamIds, isCaptainOfTeam } from "./validate-captain"

function getCurrentYear(): number {
	const override = process.env.SEASON_YEAR
	if (override) {
		const year = parseInt(override, 10)
		if (!isNaN(year)) return year
	}
	return new Date().getFullYear()
}

async function getSessionEmail(): Promise<string | null> {
	const session = await auth.api.getSession({ headers: await headers() })
	return session?.user.email ?? null
}

// ── Email OTP ───────────────────────────────────────────────────────

export async function sendCaptainOtp(
	email: string,
): Promise<{ success?: boolean; error?: string }> {
	const year = getCurrentYear()
	const teamIds = await getCaptainTeamIds(email, year)
	if (teamIds.length === 0) {
		return {
			error: "This email is not registered as a captain for the current season.",
		}
	}

	await auth.api.sendVerificationOTP({
		body: { email, type: "sign-in" },
	})

	return { success: true }
}

export async function verifyCaptainOtp(
	email: string,
	otp: string,
): Promise<{ success?: boolean; error?: string }> {
	try {
		await auth.api.signInEmailOTP({
			body: { email, otp },
			headers: await headers(),
		})
	} catch {
		return { error: "Invalid or expired code. Please try again." }
	}

	const year = getCurrentYear()
	const teamIds = await getCaptainTeamIds(email, year)
	if (teamIds.length === 0) {
		return { error: "This email is not registered as a captain for the current season." }
	}

	return { success: true }
}

// ── Teams ──────────────────────────────────────────────────────────

export async function listCaptainTeams(): Promise<ActionResult<CaptainTeam[]>> {
	const email = await getSessionEmail()
	if (!email) return { success: false, error: "Not authenticated" }

	const year = getCurrentYear()

	try {
		const rows = await db
			.select({
				id: team.id,
				year: team.year,
				groupName: team.groupName,
				isSenior: team.isSenior,
				clubId: team.clubId,
				clubName: club.name,
			})
			.from(teamCaptain)
			.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
			.innerJoin(team, eq(teamCaptain.teamId, team.id))
			.innerJoin(club, eq(team.clubId, club.id))
			.where(and(eq(contact.email, email), eq(team.year, year)))
			.orderBy(asc(team.groupName), asc(club.name))

		return { success: true, data: rows }
	} catch (error) {
		console.error("Failed to list captain teams:", error)
		return { success: false, error: "Failed to list teams" }
	}
}

export async function getCaptainTeam(teamId: number): Promise<ActionResult<CaptainTeam>> {
	const email = await getSessionEmail()
	if (!email) return { success: false, error: "Not authenticated" }

	const authorized = await isCaptainOfTeam(email, teamId)
	if (!authorized) return { success: false, error: "Not authorized" }

	try {
		const rows = await db
			.select({
				id: team.id,
				year: team.year,
				groupName: team.groupName,
				isSenior: team.isSenior,
				clubId: team.clubId,
				clubName: club.name,
			})
			.from(team)
			.innerJoin(club, eq(team.clubId, club.id))
			.where(eq(team.id, teamId))

		const row = rows[0]
		if (!row) return { success: false, error: "Team not found" }

		return { success: true, data: row }
	} catch (error) {
		console.error("Failed to get team:", error)
		return { success: false, error: "Failed to get team" }
	}
}

// ── Opponents ──────────────────────────────────────────────────────

export async function listOpponents(teamId: number): Promise<ActionResult<OpponentOption[]>> {
	const email = await getSessionEmail()
	if (!email) return { success: false, error: "Not authenticated" }

	const authorized = await isCaptainOfTeam(email, teamId)
	if (!authorized) return { success: false, error: "Not authorized" }

	try {
		const selfRows = await db
			.select({ year: team.year, groupName: team.groupName })
			.from(team)
			.where(eq(team.id, teamId))

		const self = selfRows[0]
		if (!self) return { success: false, error: "Team not found" }

		const opponents = await db
			.select({
				id: team.id,
				clubName: club.name,
			})
			.from(team)
			.innerJoin(club, eq(team.clubId, club.id))
			.where(and(eq(team.year, self.year), eq(team.groupName, self.groupName), ne(team.id, teamId)))
			.orderBy(asc(club.name))

		return { success: true, data: opponents }
	} catch (error) {
		console.error("Failed to list opponents:", error)
		return { success: false, error: "Failed to list opponents" }
	}
}

// ── Results ────────────────────────────────────────────────────────

export async function listCaptainResults(teamId: number): Promise<ActionResult<CaptainResult[]>> {
	const email = await getSessionEmail()
	if (!email) return { success: false, error: "Not authenticated" }

	const authorized = await isCaptainOfTeam(email, teamId)
	if (!authorized) return { success: false, error: "Not authorized" }

	const homeTeam = aliasedTable(team, "homeTeam")
	const awayTeam = aliasedTable(team, "awayTeam")
	const homeClub = aliasedTable(club, "homeClub")
	const awayClub = aliasedTable(club, "awayClub")

	try {
		const rows = await db
			.select({
				id: matchPlayResult.id,
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
			.where(or(eq(matchPlayResult.homeTeamId, teamId), eq(matchPlayResult.awayTeamId, teamId)))
			.orderBy(asc(matchPlayResult.matchDate))

		return { success: true, data: rows }
	} catch (error) {
		console.error("Failed to list results:", error)
		return { success: false, error: "Failed to list results" }
	}
}

export async function saveCaptainResult(
	input: CaptainResultInput,
): Promise<ActionResult<{ id: number }>> {
	const email = await getSessionEmail()
	if (!email) return { success: false, error: "Not authenticated" }

	const authorized = await isCaptainOfTeam(email, input.captainTeamId)
	if (!authorized) return { success: false, error: "Not authorized" }

	if (!input.opponentTeamId || input.opponentTeamId === input.captainTeamId) {
		return { success: false, error: "Please select a valid opponent" }
	}

	if (!input.matchDate?.trim()) {
		return { success: false, error: "Match date is required" }
	}

	const today = new Date().toISOString().slice(0, 10)
	if (input.matchDate > today) {
		return { success: false, error: "Match date cannot be in the future" }
	}

	const notes = input.notes?.trim() || null

	try {
		const selfRows = await db
			.select({ year: team.year, groupName: team.groupName })
			.from(team)
			.where(eq(team.id, input.captainTeamId))
		const self = selfRows[0]
		if (!self) return { success: false, error: "Team not found" }

		const opponentRows = await db
			.select({ year: team.year, groupName: team.groupName })
			.from(team)
			.where(eq(team.id, input.opponentTeamId))
		const opponent = opponentRows[0]
		if (!opponent) return { success: false, error: "Opponent not found" }

		if (opponent.year !== self.year || opponent.groupName !== self.groupName) {
			return { success: false, error: "Opponent must be in the same group" }
		}

		const homeTeamId = input.weAreHome ? input.captainTeamId : input.opponentTeamId
		const awayTeamId = input.weAreHome ? input.opponentTeamId : input.captainTeamId
		const homeTeamScore = input.weAreHome ? input.ourScore : input.opponentScore
		const awayTeamScore = input.weAreHome ? input.opponentScore : input.ourScore

		const existing = await db
			.select({ id: matchPlayResult.id, notes: matchPlayResult.notes })
			.from(matchPlayResult)
			.where(
				and(
					eq(matchPlayResult.homeTeamId, homeTeamId),
					eq(matchPlayResult.awayTeamId, awayTeamId),
					eq(matchPlayResult.matchDate, input.matchDate),
				),
			)
			.limit(1)

		const existingId = input.id ?? existing[0]?.id
		const priorNotes = existing[0]?.notes ?? null
		const notesChanged = notes !== null && notes !== priorNotes
		let resultId: number

		if (existingId !== undefined) {
			await db
				.update(matchPlayResult)
				.set({
					groupName: self.groupName,
					matchDate: input.matchDate,
					homeTeamId,
					awayTeamId,
					homeTeamScore,
					awayTeamScore,
					forfeit: input.forfeit,
					enteredBy: email,
					notes,
				})
				.where(eq(matchPlayResult.id, existingId))
			resultId = existingId
		} else {
			const result = await db.insert(matchPlayResult).values({
				groupName: self.groupName,
				matchDate: input.matchDate,
				homeTeamId,
				awayTeamId,
				homeTeamScore,
				awayTeamScore,
				forfeit: input.forfeit,
				enteredBy: email,
				notes,
			})
			resultId = result[0].insertId
		}

		if (notesChanged && notes) {
			void notifyCaptainNote({
				resultId,
				captainEmail: email,
				homeTeamId,
				awayTeamId,
				matchDate: input.matchDate,
				homeTeamScore,
				awayTeamScore,
				groupName: self.groupName,
				notes,
			}).catch((err) => {
				console.error("Failed to send captain note email:", err)
			})
		}

		return { success: true, data: { id: resultId } }
	} catch (error) {
		console.error("Failed to save result:", error)
		return { success: false, error: "Failed to save result" }
	}
}

async function notifyCaptainNote(args: {
	resultId: number
	captainEmail: string
	homeTeamId: number
	awayTeamId: number
	matchDate: string
	homeTeamScore: string
	awayTeamScore: string
	groupName: string
	notes: string
}): Promise<void> {
	const rows = await db
		.select({ teamId: team.id, clubName: club.name })
		.from(team)
		.innerJoin(club, eq(team.clubId, club.id))
		.where(or(eq(team.id, args.homeTeamId), eq(team.id, args.awayTeamId)))

	const homeClubName = rows.find((r) => r.teamId === args.homeTeamId)?.clubName
	const awayClubName = rows.find((r) => r.teamId === args.awayTeamId)?.clubName
	if (!homeClubName || !awayClubName) return

	await sendCaptainNoteEmail({
		resultId: args.resultId,
		captainEmail: args.captainEmail,
		homeClubName,
		awayClubName,
		matchDate: args.matchDate,
		homeTeamScore: args.homeTeamScore,
		awayTeamScore: args.awayTeamScore,
		groupName: args.groupName,
		notes: args.notes,
	})
}

export async function getCaptainResult(
	teamId: number,
	resultId: number,
): Promise<ActionResult<CaptainResult>> {
	const email = await getSessionEmail()
	if (!email) return { success: false, error: "Not authenticated" }

	const authorized = await isCaptainOfTeam(email, teamId)
	if (!authorized) return { success: false, error: "Not authorized" }

	const homeTeam = aliasedTable(team, "homeTeam")
	const awayTeam = aliasedTable(team, "awayTeam")
	const homeClub = aliasedTable(club, "homeClub")
	const awayClub = aliasedTable(club, "awayClub")

	try {
		const rows = await db
			.select({
				id: matchPlayResult.id,
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
			.where(eq(matchPlayResult.id, resultId))

		const row = rows[0]
		if (!row) return { success: false, error: "Result not found" }

		if (row.homeTeamId !== teamId && row.awayTeamId !== teamId) {
			return { success: false, error: "Result does not involve this team" }
		}

		return { success: true, data: row }
	} catch (error) {
		console.error("Failed to get result:", error)
		return { success: false, error: "Failed to get result" }
	}
}
