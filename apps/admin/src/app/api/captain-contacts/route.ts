import { club, clubContact, contact, team, teamCaptain } from "@mpga/database"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { sendCaptainContactsEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
	let body: {
		email?: string
		groupName?: string
		year?: number
	}
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
	}

	const { email, groupName, year } = body

	if (!email || !groupName || !year) {
		return NextResponse.json({ error: "Email, group name, and year are required" }, { status: 400 })
	}

	try {
		// Find contact by email
		const contacts = await db
			.select({ id: contact.id })
			.from(contact)
			.where(eq(contact.email, email))

		// Check if any of the matching contacts is both a club contact AND a team captain in this group
		let verified = false
		for (const c of contacts) {
			const isClubContact = await db
				.select({ id: clubContact.id })
				.from(clubContact)
				.where(eq(clubContact.contactId, c.id))
				.limit(1)

			if (isClubContact.length === 0) continue

			const isCaptainInGroup = await db
				.select({ id: teamCaptain.id })
				.from(teamCaptain)
				.innerJoin(team, eq(teamCaptain.teamId, team.id))
				.where(
					and(eq(teamCaptain.contactId, c.id), eq(team.groupName, groupName), eq(team.year, year)),
				)
				.limit(1)

			if (isCaptainInGroup.length > 0) {
				verified = true
				break
			}
		}

		// Always return success to avoid leaking whether an email exists in the system
		if (!verified) {
			return NextResponse.json({ success: true })
		}

		// Get all captains in the group
		const captains = await db
			.select({
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
				primaryPhone: contact.primaryPhone,
				alternatePhone: contact.alternatePhone,
				clubName: club.name,
			})
			.from(teamCaptain)
			.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
			.innerJoin(team, eq(teamCaptain.teamId, team.id))
			.innerJoin(club, eq(team.clubId, club.id))
			.where(and(eq(team.groupName, groupName), eq(team.year, year)))
			.orderBy(club.name, contact.lastName)

		await sendCaptainContactsEmail(email, groupName, year, captains)

		return NextResponse.json({ success: true })
	} catch (err) {
		console.error("Failed to process captain contacts request:", err)
		return NextResponse.json({ error: "Failed to send captain contacts" }, { status: 500 })
	}
}
