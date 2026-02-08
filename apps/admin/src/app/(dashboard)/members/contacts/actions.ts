"use server"

import { clubContact, clubContactRole, committee, contact } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

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
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const firstName = data.firstName?.trim()
	const lastName = data.lastName?.trim()

	if (!firstName || !lastName) {
		return { success: false, error: "First name and last name are required" }
	}

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
			})
			.from(contact)
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		// Union-Find
		const parent = new Map<number, number>()
		const rank = new Map<number, number>()
		const matchTypes = new Map<number, Set<string>>()
		const matchReasons = new Map<number, string[]>()

		function find(x: number): number {
			if (!parent.has(x)) {
				parent.set(x, x)
				rank.set(x, 0)
			}
			if (parent.get(x) !== x) {
				parent.set(x, find(parent.get(x)!))
			}
			return parent.get(x)!
		}

		function union(a: number, b: number, type: string, reason: string) {
			const ra = find(a)
			const rb = find(b)
			if (ra === rb) {
				matchTypes.get(ra)!.add(type)
				return
			}
			const rankA = rank.get(ra) ?? 0
			const rankB = rank.get(rb) ?? 0
			let newRoot: number
			let oldRoot: number
			if (rankA < rankB) {
				parent.set(ra, rb)
				newRoot = rb
				oldRoot = ra
			} else if (rankA > rankB) {
				parent.set(rb, ra)
				newRoot = ra
				oldRoot = rb
			} else {
				parent.set(rb, ra)
				rank.set(ra, rankA + 1)
				newRoot = ra
				oldRoot = rb
			}
			// Merge match info
			const newTypes = matchTypes.get(newRoot) ?? new Set<string>()
			const oldTypes = matchTypes.get(oldRoot) ?? new Set<string>()
			for (const t of oldTypes) newTypes.add(t)
			newTypes.add(type)
			matchTypes.set(newRoot, newTypes)
			const newReasons = matchReasons.get(newRoot) ?? []
			const oldReasons = matchReasons.get(oldRoot) ?? []
			matchReasons.set(newRoot, [...newReasons, ...oldReasons, reason])
		}

		// Initialize all contacts
		for (const c of results) {
			find(c.id)
			matchTypes.set(find(c.id), new Set())
			matchReasons.set(find(c.id), [])
		}

		// Build lookup maps
		const contactById = new Map<number, ContactData>()
		const emailMap = new Map<string, number[]>()
		const phoneMap = new Map<string, number[]>()
		const nameMap = new Map<string, number[]>()

		for (const c of results) {
			contactById.set(c.id, c)
			if (c.email?.trim()) {
				const key = c.email.trim().toLowerCase()
				if (!emailMap.has(key)) emailMap.set(key, [])
				emailMap.get(key)!.push(c.id)
			}
			const phones = [c.primaryPhone, c.alternatePhone].filter(Boolean)
			for (const p of phones) {
				const digits = p!.replace(/\D/g, "")
				if (digits) {
					if (!phoneMap.has(digits)) phoneMap.set(digits, [])
					phoneMap.get(digits)!.push(c.id)
				}
			}
			const name = `${c.firstName} ${c.lastName}`.trim().toLowerCase()
			if (name) {
				if (!nameMap.has(name)) nameMap.set(name, [])
				nameMap.get(name)!.push(c.id)
			}
		}

		// Helper: do two contacts share a first or last name?
		function sharesNamePart(idA: number, idB: number): boolean {
			const a = contactById.get(idA)!
			const b = contactById.get(idB)!
			const aFirst = a.firstName.trim().toLowerCase()
			const bFirst = b.firstName.trim().toLowerCase()
			const aLast = a.lastName.trim().toLowerCase()
			const bLast = b.lastName.trim().toLowerCase()
			return (aFirst !== "" && aFirst === bFirst) || (aLast !== "" && aLast === bLast)
		}

		// Name matches: always union
		for (const [key, ids] of nameMap) {
			for (let i = 1; i < ids.length; i++) {
				union(ids[0]!, ids[i]!, "NAME", `Name: ${key}`)
			}
		}
		// Email matches: only union contacts that share a name part
		for (const [key, ids] of emailMap) {
			for (let i = 0; i < ids.length; i++) {
				for (let j = i + 1; j < ids.length; j++) {
					if (sharesNamePart(ids[i]!, ids[j]!)) {
						union(ids[i]!, ids[j]!, "EMAIL", `Email: ${key}`)
					}
				}
			}
		}
		// Phone matches: only union contacts that share a name part
		for (const [key, ids] of phoneMap) {
			for (let i = 0; i < ids.length; i++) {
				for (let j = i + 1; j < ids.length; j++) {
					if (sharesNamePart(ids[i]!, ids[j]!)) {
						union(ids[i]!, ids[j]!, "PHONE", `Phone: ${key}`)
					}
				}
			}
		}

		// Collect groups
		const groupMap = new Map<number, ContactData[]>()
		for (const c of results) {
			const root = find(c.id)
			if (!groupMap.has(root)) groupMap.set(root, [])
			groupMap.get(root)!.push(c)
		}

		const groups: DuplicateGroup[] = []
		for (const [root, contacts] of groupMap) {
			if (contacts.length < 2) continue
			const types = matchTypes.get(root) ?? new Set()
			const reasons = matchReasons.get(root) ?? []
			const confidence = types.has("EMAIL") || types.has("PHONE") ? "HIGH" : "LOW"
			const uniqueReasons = [...new Set(reasons)]
			groups.push({
				id: `group-${root}`,
				contacts,
				confidence,
				matchReason: uniqueReasons.join("; "),
			})
		}

		// Sort: HIGH first, then by group size descending
		groups.sort((a, b) => {
			if (a.confidence !== b.confidence) {
				return a.confidence === "HIGH" ? -1 : 1
			}
			return b.contacts.length - a.contacts.length
		})

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
	const userId = await requireAuth()
	if (!userId) {
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

			const fillableFields = [
				"primaryPhone",
				"alternatePhone",
				"email",
				"addressText",
				"city",
				"state",
				"zip",
				"notes",
			] as const

			const updates: Record<string, string> = {}
			for (const field of fillableFields) {
				if (!target[field]) {
					const donor = sources.find((s) => s[field])
					if (donor) {
						updates[field] = donor[field] as string
					}
				}
			}
			if (Object.keys(updates).length > 0) {
				await tx.update(contact).set(updates).where(eq(contact.id, targetId))
			}

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
					if (targetClubIds.has(scc.clubId)) {
						// Delete child roles first, then the clubContact
						await tx.delete(clubContactRole).where(eq(clubContactRole.clubContactId, scc.id))
						await tx.delete(clubContact).where(eq(clubContact.id, scc.id))
					} else {
						await tx
							.update(clubContact)
							.set({ contactId: targetId })
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
					const key = `${sc.role}|${sc.homeClubId}`
					if (targetCommitteeKeys.has(key)) {
						await tx.delete(committee).where(eq(committee.id, sc.id))
					} else {
						await tx.update(committee).set({ contactId: targetId }).where(eq(committee.id, sc.id))
						targetCommitteeKeys.add(key)
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
