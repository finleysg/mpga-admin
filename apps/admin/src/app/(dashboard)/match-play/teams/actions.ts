"use server"

import { club, clubContact, contact, matchPlayGroup, team, teamCaptain } from "@mpga/database"
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

export async function listGroupNamesAction(year: number): Promise<ActionResult<string[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({ groupName: matchPlayGroup.groupName })
			.from(matchPlayGroup)
			.where(eq(matchPlayGroup.year, year))
			.orderBy(asc(matchPlayGroup.groupName))

		return { success: true, data: results.map((r) => r.groupName) }
	} catch (error) {
		console.error("Failed to list group names:", error)
		return { success: false, error: "Failed to list group names" }
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

export interface CaptainData {
	id: number
	contactId: number
	firstName: string
	lastName: string
	email: string | null
	primaryPhone: string | null
}

export interface ClubContactOption {
	id: number
	firstName: string
	lastName: string
	email: string | null
}

export async function listTeamCaptainsAction(teamId: number): Promise<ActionResult<CaptainData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: teamCaptain.id,
				contactId: teamCaptain.contactId,
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
				primaryPhone: contact.primaryPhone,
			})
			.from(teamCaptain)
			.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
			.where(eq(teamCaptain.teamId, teamId))
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list team captains:", error)
		return { success: false, error: "Failed to list team captains" }
	}
}

export async function addTeamCaptainAction(
	teamId: number,
	contactId: number,
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const result = await db.insert(teamCaptain).values({ teamId, contactId })
		return { success: true, data: { id: result[0].insertId } }
	} catch (error) {
		console.error("Failed to add team captain:", error)
		return { success: false, error: "Failed to add team captain" }
	}
}

export async function removeTeamCaptainAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(teamCaptain).where(eq(teamCaptain.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to remove team captain:", error)
		return { success: false, error: "Failed to remove team captain" }
	}
}

export async function listClubContactsAction(
	clubId: number,
): Promise<ActionResult<ClubContactOption[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: contact.id,
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
			})
			.from(clubContact)
			.innerJoin(contact, eq(clubContact.contactId, contact.id))
			.where(eq(clubContact.clubId, clubId))
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list club contacts:", error)
		return { success: false, error: "Failed to list club contacts" }
	}
}

export interface CaptainExportRow {
	year: number
	groupName: string
	clubName: string
	isSenior: boolean
	captainName: string
	email: string
	phone: string
}

export async function listTeamCaptainsForExportAction(
	year: number,
): Promise<ActionResult<CaptainExportRow[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				year: team.year,
				groupName: team.groupName,
				clubName: club.name,
				isSenior: team.isSenior,
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
				primaryPhone: contact.primaryPhone,
			})
			.from(teamCaptain)
			.innerJoin(team, eq(teamCaptain.teamId, team.id))
			.innerJoin(club, eq(team.clubId, club.id))
			.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
			.where(eq(team.year, year))
			.orderBy(asc(team.groupName), asc(club.name), asc(contact.lastName))

		const rows: CaptainExportRow[] = results.map((r) => ({
			year: r.year,
			groupName: r.groupName,
			clubName: r.clubName,
			isSenior: r.isSenior,
			captainName: `${r.firstName} ${r.lastName}`,
			email: r.email ?? "",
			phone: r.primaryPhone ?? "",
		}))

		return { success: true, data: rows }
	} catch (error) {
		console.error("Failed to export captains:", error)
		return { success: false, error: "Failed to export captains" }
	}
}
