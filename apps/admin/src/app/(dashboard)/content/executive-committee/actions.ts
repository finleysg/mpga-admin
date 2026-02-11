"use server"

import { club, committee, contact } from "@mpga/database"
import { ContentSystemName, type ActionResult } from "@mpga/types"
import { asc, eq } from "drizzle-orm"

import { getContentAction, saveContentAction } from "@/lib/content-actions"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

export interface CommitteeMemberData {
	id: number
	role: string
	contactId: number
	contactName: string
	homeClubId: number
	homeClubName: string
}

export interface ContactOption {
	id: number
	name: string
}

export interface ClubOption {
	id: number
	name: string
}

export async function getECContentAction() {
	return getContentAction(ContentSystemName.ExecutiveCommittee)
}

export async function saveECContentAction(data: { id?: number; title: string; content: string }) {
	return saveContentAction(
		{
			id: data.id,
			systemName: ContentSystemName.ExecutiveCommittee,
			title: data.title,
			contentText: data.content,
		},
		"/about-us",
	)
}

export async function listCommitteeMembersAction(): Promise<ActionResult<CommitteeMemberData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: committee.id,
				role: committee.role,
				contactId: committee.contactId,
				homeClubId: committee.homeClubId,
				firstName: contact.firstName,
				lastName: contact.lastName,
				clubName: club.name,
			})
			.from(committee)
			.innerJoin(contact, eq(committee.contactId, contact.id))
			.innerJoin(club, eq(committee.homeClubId, club.id))
			.orderBy(asc(committee.role))

		const data = results.map((r) => ({
			id: r.id,
			role: r.role,
			contactId: r.contactId,
			contactName: `${r.firstName} ${r.lastName}`,
			homeClubId: r.homeClubId,
			homeClubName: r.clubName,
		}))

		return { success: true, data }
	} catch (error) {
		console.error("Failed to list committee members:", error)
		return { success: false, error: "Failed to list committee members" }
	}
}

export async function saveCommitteeMemberAction(data: {
	id?: number
	role: string
	contactId: number
	homeClubId: number
}): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const role = data.role?.trim()
	if (!role) {
		return { success: false, error: "Role is required" }
	}

	try {
		if (data.id !== undefined) {
			await db
				.update(committee)
				.set({
					role,
					contactId: data.contactId,
					homeClubId: data.homeClubId,
				})
				.where(eq(committee.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(committee).values({
				role,
				contactId: data.contactId,
				homeClubId: data.homeClubId,
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save committee member:", error)
		return { success: false, error: "Failed to save committee member" }
	}
}

export async function deleteCommitteeMemberAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(committee).where(eq(committee.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete committee member:", error)
		return { success: false, error: "Failed to delete committee member" }
	}
}

export async function listContactOptionsAction(): Promise<ActionResult<ContactOption[]>> {
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
			})
			.from(contact)
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		const data = results.map((r) => ({
			id: r.id,
			name: `${r.firstName} ${r.lastName}`,
		}))

		return { success: true, data }
	} catch (error) {
		console.error("Failed to list contacts:", error)
		return { success: false, error: "Failed to list contacts" }
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
