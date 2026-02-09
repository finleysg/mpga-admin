"use server"

import { club, clubContact, clubContactRole, contact, golfCourse, membership } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { and, asc, eq, like, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

// ── Types ───────────────────────────────────────────────────────────

interface ClubInput {
	id?: number
	name: string
	website: string
	golfCourseId: number | null
	size: number | null
	archived: boolean
	notes?: string | null
}

export interface ClubData {
	id: number
	name: string
	website: string
	golfCourseId: number | null
	golfCourseName: string | null
	size: number | null
	archived: boolean
	notes: string | null
	isMember: boolean
}

export interface GolfCourseOption {
	id: number
	name: string
}

export interface ClubContactData {
	clubContactId: number
	contactId: number
	firstName: string
	lastName: string
	email: string | null
	primaryPhone: string | null
	isPrimary: boolean
	roles: { id: number; role: string }[]
}

export interface ContactSearchResult {
	id: number
	firstName: string
	lastName: string
	email: string | null
}

export interface MembershipData {
	id: number
	year: number
	paymentDate: string
	paymentType: string
	paymentCode: string
}

// ── Club CRUD ───────────────────────────────────────────────────────

export async function listClubsAction(): Promise<ActionResult<ClubData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const currentYear = new Date().getFullYear()

	try {
		const rows = await db
			.select({
				id: club.id,
				name: club.name,
				website: club.website,
				golfCourseId: club.golfCourseId,
				golfCourseName: golfCourse.name,
				size: club.size,
				archived: club.archived,
				notes: club.notes,
				membershipId: membership.id,
			})
			.from(club)
			.leftJoin(golfCourse, eq(club.golfCourseId, golfCourse.id))
			.leftJoin(membership, and(eq(membership.clubId, club.id), eq(membership.year, currentYear)))
			.orderBy(asc(club.name))

		const results: ClubData[] = rows.map((row) => ({
			id: row.id,
			name: row.name,
			website: row.website,
			golfCourseId: row.golfCourseId,
			golfCourseName: row.golfCourseName,
			size: row.size,
			archived: row.archived,
			notes: row.notes,
			isMember: row.membershipId !== null,
		}))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list clubs:", error)
		return { success: false, error: "Failed to list clubs" }
	}
}

export async function getClubAction(id: number): Promise<ActionResult<ClubData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const currentYear = new Date().getFullYear()

	try {
		const rows = await db
			.select({
				id: club.id,
				name: club.name,
				website: club.website,
				golfCourseId: club.golfCourseId,
				golfCourseName: golfCourse.name,
				size: club.size,
				archived: club.archived,
				notes: club.notes,
				membershipId: membership.id,
			})
			.from(club)
			.leftJoin(golfCourse, eq(club.golfCourseId, golfCourse.id))
			.leftJoin(membership, and(eq(membership.clubId, club.id), eq(membership.year, currentYear)))
			.where(eq(club.id, id))

		const row = rows[0]
		if (!row) {
			return { success: false, error: "Club not found" }
		}

		return {
			success: true,
			data: {
				id: row.id,
				name: row.name,
				website: row.website,
				golfCourseId: row.golfCourseId,
				golfCourseName: row.golfCourseName,
				size: row.size,
				archived: row.archived,
				notes: row.notes,
				isMember: row.membershipId !== null,
			},
		}
	} catch (error) {
		console.error("Failed to get club:", error)
		return { success: false, error: "Failed to get club" }
	}
}

export async function saveClubAction(data: ClubInput): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const name = data.name?.trim()

	if (!name) {
		return { success: false, error: "Name is required" }
	}

	try {
		if (data.id !== undefined) {
			await db
				.update(club)
				.set({
					name,
					website: data.website,
					golfCourseId: data.golfCourseId,
					size: data.size,
					archived: data.archived,
					notes: data.notes ?? null,
				})
				.where(eq(club.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(club).values({
				name,
				website: data.website,
				golfCourseId: data.golfCourseId,
				size: data.size,
				archived: data.archived,
				notes: data.notes ?? null,
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save club:", error)
		return { success: false, error: "Failed to save club" }
	}
}

export async function listGolfCourseOptionsAction(): Promise<ActionResult<GolfCourseOption[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: golfCourse.id,
				name: golfCourse.name,
			})
			.from(golfCourse)
			.orderBy(asc(golfCourse.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list golf courses:", error)
		return { success: false, error: "Failed to list golf courses" }
	}
}

// ── Club Contacts ───────────────────────────────────────────────────

export async function listClubContactsAction(
	clubId: number,
): Promise<ActionResult<ClubContactData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const contactRows = await db
			.select({
				clubContactId: clubContact.id,
				contactId: contact.id,
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
				primaryPhone: contact.primaryPhone,
				isPrimary: clubContact.isPrimary,
			})
			.from(clubContact)
			.innerJoin(contact, eq(clubContact.contactId, contact.id))
			.where(eq(clubContact.clubId, clubId))
			.orderBy(asc(contact.lastName), asc(contact.firstName))

		const clubContactIds = contactRows.map((r) => r.clubContactId)

		let roleRows: { id: number; role: string; clubContactId: number }[] = []
		if (clubContactIds.length > 0) {
			roleRows = await db
				.select({
					id: clubContactRole.id,
					role: clubContactRole.role,
					clubContactId: clubContactRole.clubContactId,
				})
				.from(clubContactRole)
				.where(or(...clubContactIds.map((ccId) => eq(clubContactRole.clubContactId, ccId))))
		}

		const data: ClubContactData[] = contactRows.map((row) => ({
			...row,
			roles: roleRows
				.filter((r) => r.clubContactId === row.clubContactId)
				.map((r) => ({ id: r.id, role: r.role })),
		}))

		return { success: true, data }
	} catch (error) {
		console.error("Failed to list club contacts:", error)
		return { success: false, error: "Failed to list club contacts" }
	}
}

export async function addClubContactAction(
	clubId: number,
	contactId: number,
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const existing = await db
			.select({ id: clubContact.id })
			.from(clubContact)
			.where(and(eq(clubContact.clubId, clubId), eq(clubContact.contactId, contactId)))

		if (existing.length > 0) {
			return { success: false, error: "Contact is already a member of this club" }
		}

		const result = await db.insert(clubContact).values({
			clubId,
			contactId,
			isPrimary: false,
		})

		return { success: true, data: { id: result[0].insertId } }
	} catch (error) {
		console.error("Failed to add club contact:", error)
		return { success: false, error: "Failed to add club contact" }
	}
}

export async function removeClubContactAction(clubContactId: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		// Delete roles first due to FK constraint
		await db.delete(clubContactRole).where(eq(clubContactRole.clubContactId, clubContactId))
		await db.delete(clubContact).where(eq(clubContact.id, clubContactId))
		return { success: true }
	} catch (error) {
		console.error("Failed to remove club contact:", error)
		return { success: false, error: "Failed to remove club contact" }
	}
}

export async function searchContactsAction(
	term: string,
): Promise<ActionResult<ContactSearchResult[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const search = `%${term.trim()}%`
	if (!term.trim()) {
		return { success: true, data: [] }
	}

	try {
		const results = await db
			.select({
				id: contact.id,
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
			})
			.from(contact)
			.where(
				or(
					like(contact.firstName, search),
					like(contact.lastName, search),
					like(contact.email, search),
				),
			)
			.orderBy(asc(contact.lastName), asc(contact.firstName))
			.limit(20)

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to search contacts:", error)
		return { success: false, error: "Failed to search contacts" }
	}
}

export async function toggleClubContactPrimaryAction(clubContactId: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const rows = await db
			.select({ isPrimary: clubContact.isPrimary })
			.from(clubContact)
			.where(eq(clubContact.id, clubContactId))

		const row = rows[0]
		if (!row) {
			return { success: false, error: "Club contact not found" }
		}

		await db
			.update(clubContact)
			.set({ isPrimary: !row.isPrimary })
			.where(eq(clubContact.id, clubContactId))

		return { success: true }
	} catch (error) {
		console.error("Failed to toggle primary contact:", error)
		return { success: false, error: "Failed to toggle primary contact" }
	}
}

// ── Club Contact Roles ──────────────────────────────────────────────

export async function addClubContactRoleAction(
	clubContactId: number,
	role: string,
): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const result = await db.insert(clubContactRole).values({
			clubContactId,
			role,
		})

		return { success: true, data: { id: result[0].insertId } }
	} catch (error) {
		console.error("Failed to add role:", error)
		return { success: false, error: "Failed to add role" }
	}
}

export async function removeClubContactRoleAction(roleId: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(clubContactRole).where(eq(clubContactRole.id, roleId))
		return { success: true }
	} catch (error) {
		console.error("Failed to remove role:", error)
		return { success: false, error: "Failed to remove role" }
	}
}

// ── Membership / Season Payment ─────────────────────────────────────

export async function getClubMembershipAction(
	clubId: number,
	year: number,
): Promise<ActionResult<MembershipData | null>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: membership.id,
				year: membership.year,
				paymentDate: membership.paymentDate,
				paymentType: membership.paymentType,
				paymentCode: membership.paymentCode,
			})
			.from(membership)
			.where(and(eq(membership.clubId, clubId), eq(membership.year, year)))

		if (results.length === 0) {
			return { success: true, data: null }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get club membership:", error)
		return { success: false, error: "Failed to get club membership" }
	}
}

export async function saveClubPaymentAction(data: {
	clubId: number
	paymentDate: string
	paymentCode: string
}): Promise<ActionResult<{ id: number }>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	const currentYear = new Date().getFullYear()

	try {
		const result = await db.insert(membership).values({
			clubId: data.clubId,
			year: currentYear,
			paymentDate: data.paymentDate,
			paymentType: "CK",
			paymentCode: data.paymentCode,
			createDate: sql`NOW(6)`,
		})

		return { success: true, data: { id: result[0].insertId } }
	} catch (error) {
		console.error("Failed to save payment:", error)
		return { success: false, error: "Failed to save payment" }
	}
}
