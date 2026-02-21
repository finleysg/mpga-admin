"use server"

import { club, clubContact, clubContactRole, committee, contact } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { findDuplicateGroups } from "@/lib/find-duplicates"
import {
	buildMergeFieldUpdates,
	classifyClubContact,
	classifyCommittee,
} from "@/lib/merge-contacts"
import { requireAuth, requireAuthEmail } from "@/lib/require-auth"

interface ContactInput {
	id?: number
	firstName: string
	lastName: string
	primaryPhone?: string | null
	alternatePhone?: string | null
	email?: string | null
	addressText?: string | null
	city?: string | null
	state?: string | null
	zip?: string | null
	notes?: string | null
	sendEmail?: boolean
}

export interface ContactData {
	id: number
	firstName: string
	lastName: string
	primaryPhone: string | null
	alternatePhone: string | null
	email: string | null
	addressText: string | null
	city: string | null
	state: string | null
	zip: string | null
	notes: string | null
	sendEmail: boolean
	updateDate: string | null
	updateBy: string | null
}

export async function listContactsAction(): Promise<ActionResult<ContactData[]>> {
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
				primaryPhone: contact.primaryPhone,
				alternatePhone: contact.alternatePhone,
				email: contact.email,
				addressText: contact.addressText,
				city: contact.city,
				state: contact.state,
				zip: contact.zip,
				notes: contact.notes,
				sendEmail: contact.sendEmail,
				updateDate: contact.updateDate,
				updateBy: contact.updateBy,
			})
			.from(contact)
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list contacts:", error)
		return { success: false, error: "Failed to list contacts" }
	}
}

export async function getContactAction(id: number): Promise<ActionResult<ContactData>> {
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
				primaryPhone: contact.primaryPhone,
				alternatePhone: contact.alternatePhone,
				email: contact.email,
				addressText: contact.addressText,
				city: contact.city,
				state: contact.state,
				zip: contact.zip,
				notes: contact.notes,
				sendEmail: contact.sendEmail,
				updateDate: contact.updateDate,
				updateBy: contact.updateBy,
			})
			.from(contact)
			.where(eq(contact.id, id))

		if (results.length === 0) {
			return { success: false, error: "Contact not found" }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get contact:", error)
		return { success: false, error: "Failed to get contact" }
	}
}

export async function saveContactAction(data: ContactInput): Promise<ActionResult<{ id: number }>> {
	const email = await requireAuthEmail()
	if (!email) {
		return { success: false, error: "Unauthorized" }
	}

	const firstName = data.firstName?.trim()
	const lastName = data.lastName?.trim()

	if (!firstName || !lastName) {
		return { success: false, error: "First name and last name are required" }
	}

	const now = new Date().toISOString().replace("T", " ").replace("Z", "")

	try {
		if (data.id !== undefined) {
			await db
				.update(contact)
				.set({
					firstName,
					lastName,
					primaryPhone: data.primaryPhone ?? null,
					alternatePhone: data.alternatePhone ?? null,
					email: data.email ?? null,
					addressText: data.addressText ?? null,
					city: data.city ?? null,
					state: data.state ?? null,
					zip: data.zip ?? null,
					notes: data.notes ?? null,
					sendEmail: data.sendEmail ?? true,
					updateDate: now,
					updateBy: email,
				})
				.where(eq(contact.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(contact).values({
				firstName,
				lastName,
				primaryPhone: data.primaryPhone ?? null,
				alternatePhone: data.alternatePhone ?? null,
				email: data.email ?? null,
				addressText: data.addressText ?? null,
				city: data.city ?? null,
				state: data.state ?? null,
				zip: data.zip ?? null,
				notes: data.notes ?? null,
				sendEmail: data.sendEmail ?? true,
				updateDate: now,
				updateBy: email,
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save contact:", error)
		return { success: false, error: "Failed to save contact" }
	}
}

export interface DuplicateGroup {
	id: string
	contacts: ContactData[]
	confidence: "HIGH" | "LOW"
	matchReason: string
}

export async function findDuplicatesAction(): Promise<ActionResult<DuplicateGroup[]>> {
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
				primaryPhone: contact.primaryPhone,
				alternatePhone: contact.alternatePhone,
				email: contact.email,
				addressText: contact.addressText,
				city: contact.city,
				state: contact.state,
				zip: contact.zip,
				notes: contact.notes,
				sendEmail: contact.sendEmail,
				updateDate: contact.updateDate,
				updateBy: contact.updateBy,
			})
			.from(contact)
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		const groups = findDuplicateGroups(results)
		return { success: true, data: groups }
	} catch (error) {
		console.error("Failed to find duplicates:", error)
		return { success: false, error: "Failed to find duplicates" }
	}
}

export async function mergeContactsAction(
	targetId: number,
	sourceIds: number[],
): Promise<ActionResult> {
	const email = await requireAuthEmail()
	if (!email) {
		return { success: false, error: "Unauthorized" }
	}

	if (sourceIds.length === 0) {
		return { success: false, error: "No source contacts to merge" }
	}

	if (sourceIds.includes(targetId)) {
		return { success: false, error: "Target cannot be in source list" }
	}

	try {
		await db.transaction(async (tx) => {
			// 1. Fetch target contact
			const [target] = await tx.select().from(contact).where(eq(contact.id, targetId))
			if (!target) throw new Error("Target contact not found")

			// 2. Fetch source contacts and copy missing data to target
			const sources = await tx.select().from(contact).where(inArray(contact.id, sourceIds))

			const now = new Date().toISOString().replace("T", " ").replace("Z", "")
			const updates = buildMergeFieldUpdates(target, sources)
			await tx
				.update(contact)
				.set({ ...updates, updateDate: now, updateBy: email })
				.where(eq(contact.id, targetId))

			// 3. Reassign clubContact rows
			const targetClubContacts = await tx
				.select()
				.from(clubContact)
				.where(eq(clubContact.contactId, targetId))
			const targetClubIds = new Set(targetClubContacts.map((cc) => cc.clubId))

			for (const sourceId of sourceIds) {
				const sourceClubContacts = await tx
					.select()
					.from(clubContact)
					.where(eq(clubContact.contactId, sourceId))

				for (const scc of sourceClubContacts) {
					if (classifyClubContact(scc.clubId, targetClubIds) === "delete") {
						await tx.delete(clubContactRole).where(eq(clubContactRole.clubContactId, scc.id))
						await tx.delete(clubContact).where(eq(clubContact.id, scc.id))
					} else {
						await tx
							.update(clubContact)
							.set({ contactId: targetId, updateDate: now, updateBy: email })
							.where(eq(clubContact.id, scc.id))
						targetClubIds.add(scc.clubId)
					}
				}
			}

			// 4. Reassign committee rows
			const targetCommittees = await tx
				.select()
				.from(committee)
				.where(eq(committee.contactId, targetId))
			const targetCommitteeKeys = new Set(targetCommittees.map((c) => `${c.role}|${c.homeClubId}`))

			for (const sourceId of sourceIds) {
				const sourceCommittees = await tx
					.select()
					.from(committee)
					.where(eq(committee.contactId, sourceId))

				for (const sc of sourceCommittees) {
					if (classifyCommittee(sc.role, sc.homeClubId, targetCommitteeKeys) === "delete") {
						await tx.delete(committee).where(eq(committee.id, sc.id))
					} else {
						await tx.update(committee).set({ contactId: targetId }).where(eq(committee.id, sc.id))
						targetCommitteeKeys.add(`${sc.role}|${sc.homeClubId}`)
					}
				}
			}

			// 5. Delete source contacts
			await tx.delete(contact).where(inArray(contact.id, sourceIds))
		})

		return { success: true }
	} catch (error) {
		console.error("Failed to merge contacts:", error)
		return { success: false, error: "Failed to merge contacts" }
	}
}

export interface ContactClubData {
	clubId: number
	clubName: string
	isPrimary: boolean
	roles: string[]
}

export async function getContactClubsAction(
	contactId: number,
): Promise<ActionResult<ContactClubData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const rows = await db
			.select({
				clubId: club.id,
				clubName: club.name,
				isPrimary: clubContact.isPrimary,
				roleName: clubContactRole.role,
			})
			.from(clubContact)
			.innerJoin(club, eq(club.id, clubContact.clubId))
			.leftJoin(clubContactRole, eq(clubContactRole.clubContactId, clubContact.id))
			.where(eq(clubContact.contactId, contactId))
			.orderBy(asc(club.name))

		const clubMap = new Map<number, ContactClubData>()
		for (const row of rows) {
			const existing = clubMap.get(row.clubId)
			if (existing) {
				if (row.roleName && !existing.roles.includes(row.roleName)) {
					existing.roles.push(row.roleName)
				}
			} else {
				clubMap.set(row.clubId, {
					clubId: row.clubId,
					clubName: row.clubName,
					isPrimary: row.isPrimary,
					roles: row.roleName ? [row.roleName] : [],
				})
			}
		}

		return { success: true, data: Array.from(clubMap.values()) }
	} catch (error) {
		console.error("Failed to get contact clubs:", error)
		return { success: false, error: "Failed to get contact clubs" }
	}
}

export async function deleteContactAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(contact).where(eq(contact.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete contact:", error)

		if (error instanceof Error && error.message.includes("foreign key constraint")) {
			return {
				success: false,
				error: "Cannot delete: this contact is linked to a club or committee",
			}
		}

		return { success: false, error: "Failed to delete contact" }
	}
}
