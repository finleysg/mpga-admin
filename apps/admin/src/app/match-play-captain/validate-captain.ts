import { contact, team, teamCaptain } from "@mpga/database"
import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db"

export async function getCaptainTeamIds(email: string, year: number): Promise<number[]> {
	const rows = await db
		.select({ teamId: team.id })
		.from(teamCaptain)
		.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
		.innerJoin(team, eq(teamCaptain.teamId, team.id))
		.where(and(eq(contact.email, email), eq(team.year, year)))

	return rows.map((r) => r.teamId)
}

export async function isCaptainOfTeam(email: string, teamId: number): Promise<boolean> {
	const rows = await db
		.select({ id: teamCaptain.id })
		.from(teamCaptain)
		.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
		.where(and(eq(contact.email, email), eq(teamCaptain.teamId, teamId)))
		.limit(1)

	return rows.length > 0
}
