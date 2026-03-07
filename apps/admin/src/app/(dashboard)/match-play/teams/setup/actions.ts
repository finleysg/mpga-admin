"use server"

import { club, contact, matchPlayGroup, team, teamCaptain } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { and, asc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

export interface CaptainInfo {
	contactId: number
	name: string
}

export interface SetupTeam {
	id: number
	clubId: number
	clubName: string
	isSenior: boolean
	captains: CaptainInfo[]
}

export interface GroupWithTeams {
	id: number
	groupName: string
	teams: SetupTeam[]
}

export async function getGroupTeamsAction(year: number): Promise<ActionResult<GroupWithTeams[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		// Fetch groups, teams, and captains in 3 queries instead of N+1
		const groups = await db
			.select({ id: matchPlayGroup.id, groupName: matchPlayGroup.groupName })
			.from(matchPlayGroup)
			.where(eq(matchPlayGroup.year, year))
			.orderBy(asc(matchPlayGroup.groupName))

		const allTeams = await db
			.select({
				id: team.id,
				groupName: team.groupName,
				clubId: team.clubId,
				clubName: club.name,
				isSenior: team.isSenior,
			})
			.from(team)
			.innerJoin(club, eq(team.clubId, club.id))
			.where(eq(team.year, year))
			.orderBy(asc(team.groupName), asc(club.name))

		const teamIds = allTeams.map((t) => t.id)
		const allCaptains =
			teamIds.length > 0
				? await db
						.select({
							teamId: teamCaptain.teamId,
							contactId: teamCaptain.contactId,
							firstName: contact.firstName,
							lastName: contact.lastName,
						})
						.from(teamCaptain)
						.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
						.where(inArray(teamCaptain.teamId, teamIds))
						.orderBy(asc(contact.lastName), asc(contact.firstName))
				: []

		// Group captains by teamId
		const captainsByTeam = new Map<number, CaptainInfo[]>()
		for (const c of allCaptains) {
			const list = captainsByTeam.get(c.teamId) ?? []
			list.push({ contactId: c.contactId, name: `${c.firstName} ${c.lastName}` })
			captainsByTeam.set(c.teamId, list)
		}

		// Assemble result
		const result: GroupWithTeams[] = groups.map((group) => ({
			...group,
			teams: allTeams
				.filter((t) => t.groupName === group.groupName)
				.map((t) => ({
					id: t.id,
					clubId: t.clubId,
					clubName: t.clubName,
					isSenior: t.isSenior,
					captains: captainsByTeam.get(t.id) ?? [],
				})),
		}))

		return { success: true, data: result }
	} catch (error) {
		console.error("Failed to load group teams:", error)
		return { success: false, error: "Failed to load group teams" }
	}
}

export async function lookupPriorCaptainsAction(
	clubId: number,
	year: number,
	isSenior: boolean,
): Promise<ActionResult<CaptainInfo[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const priorTeams = await db
			.select({ id: team.id })
			.from(team)
			.where(and(eq(team.year, year - 1), eq(team.clubId, clubId), eq(team.isSenior, isSenior)))

		if (priorTeams.length === 0) {
			return { success: true, data: [] }
		}

		const teamIds = priorTeams.map((t) => t.id)
		const captains = await db
			.select({
				contactId: teamCaptain.contactId,
				firstName: contact.firstName,
				lastName: contact.lastName,
			})
			.from(teamCaptain)
			.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
			.where(inArray(teamCaptain.teamId, teamIds))
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		// Deduplicate by contactId
		const seen = new Set<number>()
		const unique: CaptainInfo[] = []
		for (const c of captains) {
			if (!seen.has(c.contactId)) {
				seen.add(c.contactId)
				unique.push({ contactId: c.contactId, name: `${c.firstName} ${c.lastName}` })
			}
		}

		return { success: true, data: unique }
	} catch (error) {
		console.error("Failed to lookup prior captains:", error)
		return { success: false, error: "Failed to lookup prior captains" }
	}
}

interface SaveClubInput {
	clubId: number
	captainContactIds: number[]
}

interface SaveResult {
	created: number
	removed: number
}

export async function saveGroupTeamsAction(
	year: number,
	groupName: string,
	isSenior: boolean,
	clubs: SaveClubInput[],
): Promise<ActionResult<SaveResult>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		// Fetch existing teams for this year+group
		const existingTeams = await db
			.select({ id: team.id, clubId: team.clubId })
			.from(team)
			.where(and(eq(team.year, year), eq(team.groupName, groupName)))

		const newClubIds = new Set(clubs.map((c) => c.clubId))
		const existingClubIds = new Set(existingTeams.map((t) => t.clubId))

		// Teams to remove: exist in DB but not in the new list
		const teamsToRemove = existingTeams.filter((t) => !newClubIds.has(t.clubId))

		// Clubs to add: in new list but not in DB
		const clubsToAdd = clubs.filter((c) => !existingClubIds.has(c.clubId))

		// Teams that remain: update isSenior if needed
		const teamsToUpdate = existingTeams.filter((t) => newClubIds.has(t.clubId))

		// Remove teams
		if (teamsToRemove.length > 0) {
			const removeIds = teamsToRemove.map((t) => t.id)
			await db.delete(teamCaptain).where(inArray(teamCaptain.teamId, removeIds))
			await db.delete(team).where(inArray(team.id, removeIds))
		}

		// Batch update isSenior for remaining teams
		if (teamsToUpdate.length > 0) {
			const updateIds = teamsToUpdate.map((t) => t.id)
			await db.update(team).set({ isSenior }).where(inArray(team.id, updateIds))

			// Fetch all current captains for remaining teams in one query
			const allCurrentCaptains = await db
				.select({
					id: teamCaptain.id,
					teamId: teamCaptain.teamId,
					contactId: teamCaptain.contactId,
				})
				.from(teamCaptain)
				.where(inArray(teamCaptain.teamId, updateIds))

			// Reconcile captains per team
			const captainIdsToRemove: number[] = []
			const captainsToAdd: { teamId: number; contactId: number }[] = []

			for (const existing of teamsToUpdate) {
				const clubInput = clubs.find((c) => c.clubId === existing.clubId)
				if (!clubInput) continue

				const desiredContactIds = new Set(clubInput.captainContactIds)
				const currentForTeam = allCurrentCaptains.filter((c) => c.teamId === existing.id)
				const currentContactIds = new Set(currentForTeam.map((c) => c.contactId))

				for (const c of currentForTeam) {
					if (!desiredContactIds.has(c.contactId)) {
						captainIdsToRemove.push(c.id)
					}
				}
				for (const contactId of clubInput.captainContactIds) {
					if (!currentContactIds.has(contactId)) {
						captainsToAdd.push({ teamId: existing.id, contactId })
					}
				}
			}

			if (captainIdsToRemove.length > 0) {
				await db.delete(teamCaptain).where(inArray(teamCaptain.id, captainIdsToRemove))
			}
			if (captainsToAdd.length > 0) {
				await db.insert(teamCaptain).values(captainsToAdd)
			}
		}

		// Add new teams
		let created = 0
		for (const c of clubsToAdd) {
			const result = await db.insert(team).values({
				year,
				groupName,
				isSenior,
				clubId: c.clubId,
			})
			const newTeamId = result[0].insertId
			created++

			// Add captains
			for (const contactId of c.captainContactIds) {
				await db.insert(teamCaptain).values({ teamId: newTeamId, contactId })
			}
		}

		return {
			success: true,
			data: { created, removed: teamsToRemove.length },
		}
	} catch (error) {
		console.error("Failed to save group teams:", error)

		if (error instanceof Error && error.message.includes("foreign key constraint")) {
			return {
				success: false,
				error: "Cannot remove a team that has match play results. Remove results first.",
			}
		}

		return { success: false, error: "Failed to save group teams" }
	}
}
