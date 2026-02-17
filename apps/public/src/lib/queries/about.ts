import { award, awardWinner, club, committee, contact, content, document } from "@mpga/database"
import { ContentSystemName } from "@mpga/types"
import { desc, eq } from "drizzle-orm"

import { db } from "../db"

export interface CommitteeMember {
	role: string
	name: string
	clubName: string
}

export interface AwardDetail {
	name: string
	description: string
	winners: { year: number; winner: string; notes: string | null }[]
}

export async function getAboutUsContent() {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.AboutUs))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch about us content:", error)
		return null
	}
}

export async function getExecutiveCommitteeContent() {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.ExecutiveCommittee))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch executive committee content:", error)
		return null
	}
}

export async function getPastPresidentsContent() {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.PastPresidents))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch past presidents content:", error)
		return null
	}
}

export async function getCommitteeMembers(): Promise<CommitteeMember[]> {
	try {
		const results = await db
			.select({
				role: committee.role,
				firstName: contact.firstName,
				lastName: contact.lastName,
				clubName: club.name,
			})
			.from(committee)
			.innerJoin(contact, eq(committee.contactId, contact.id))
			.innerJoin(club, eq(committee.homeClubId, club.id))

		return results.map((r) => ({
			role: r.role,
			name: `${r.firstName} ${r.lastName}`,
			clubName: r.clubName,
		}))
	} catch (error) {
		console.error("Failed to fetch committee members:", error)
		return []
	}
}

export async function getByLawsDocument() {
	try {
		const results = await db
			.select({
				title: document.title,
				file: document.file,
			})
			.from(document)
			.where(eq(document.documentType, "ByLaws"))
			.orderBy(desc(document.id))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch bylaws document:", error)
		return null
	}
}

export async function getAwardWithWinners(systemName: string): Promise<AwardDetail | null> {
	try {
		const awardResult = await db
			.select({
				name: award.name,
				description: award.description,
				id: award.id,
			})
			.from(award)
			.where(eq(award.systemName, systemName))
			.limit(1)

		const awardRow = awardResult[0]
		if (!awardRow) return null

		const winners = await db
			.select({
				year: awardWinner.year,
				winner: awardWinner.winner,
				notes: awardWinner.notes,
			})
			.from(awardWinner)
			.where(eq(awardWinner.awardId, awardRow.id))
			.orderBy(desc(awardWinner.year))

		return {
			name: awardRow.name,
			description: awardRow.description,
			winners,
		}
	} catch (error) {
		console.error(`Failed to fetch award ${systemName}:`, error)
		return null
	}
}
