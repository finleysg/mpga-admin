"use server"

import { club, clubContact, clubContactRole, contact, golfCourse, membership } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { and, asc, eq, like, or } from "drizzle-orm"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidateClubPage } from "@/lib/revalidate"
import { getStripe } from "@/lib/stripe"

import type {
	ClubContactClubData,
	ClubContactClubInput,
	ClubContactData,
	ClubDuesStatus,
	ContactSearchResult,
	GolfCourseOption,
} from "./types"
import { validateClubContact } from "./validate-contact"

// ── Auth helper ─────────────────────────────────────────────────────

async function requireClubContactAuth(
	clubId: number,
): Promise<{ authorized: true } | { authorized: false; error: string }> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) {
		return { authorized: false, error: "Not authenticated" }
	}
	const isAuthorized = await validateClubContact(clubId, session.user.email)
	if (!isAuthorized) {
		return { authorized: false, error: "Not authorized" }
	}
	return { authorized: true }
}

// ── Magic Link ──────────────────────────────────────────────────────

export async function sendClubContactVerification(
	clubId: number,
	email: string,
	callbackPath: string,
): Promise<{ success?: boolean; error?: string }> {
	const isContact = await validateClubContact(clubId, email)
	if (!isContact) {
		return { error: "This email is not associated with a contact for this club." }
	}

	await auth.api.signInMagicLink({
		body: {
			email,
			callbackURL: callbackPath,
		},
		headers: await headers(),
	})

	return { success: true }
}

// ── Club ────────────────────────────────────────────────────────────

export async function getClubForContact(
	clubId: number,
): Promise<ActionResult<ClubContactClubData>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	try {
		const rows = await db
			.select({
				id: club.id,
				name: club.name,
				website: club.website,
				golfCourseId: club.golfCourseId,
				golfCourseName: golfCourse.name,
				size: club.size,
				notes: club.notes,
			})
			.from(club)
			.leftJoin(golfCourse, eq(club.golfCourseId, golfCourse.id))
			.where(eq(club.id, clubId))

		const row = rows[0]
		if (!row) {
			return { success: false, error: "Club not found" }
		}

		return { success: true, data: row }
	} catch (error) {
		console.error("Failed to get club:", error)
		return { success: false, error: "Failed to get club" }
	}
}

export async function saveClubForContact(
	data: ClubContactClubInput,
): Promise<ActionResult<{ id: number }>> {
	const authCheck = await requireClubContactAuth(data.id)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	const name = data.name?.trim()
	if (!name) {
		return { success: false, error: "Name is required" }
	}

	try {
		await db
			.update(club)
			.set({
				name,
				website: data.website,
				golfCourseId: data.golfCourseId,
				size: data.size,
				notes: data.notes ?? null,
			})
			.where(eq(club.id, data.id))

		await revalidateClubPage(data.id)

		return { success: true, data: { id: data.id } }
	} catch (error) {
		console.error("Failed to save club:", error)
		return { success: false, error: "Failed to save club" }
	}
}

// ── Golf Courses ────────────────────────────────────────────────────

export async function listGolfCourseOptionsForContact(
	clubId: number,
): Promise<ActionResult<GolfCourseOption[]>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
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

export async function listClubContactsForContact(
	clubId: number,
): Promise<ActionResult<ClubContactData[]>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
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

export async function searchContactsForContact(
	clubId: number,
	term: string,
): Promise<ActionResult<ContactSearchResult[]>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
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

export async function addClubContactForContact(
	clubId: number,
	contactId: number,
): Promise<ActionResult<{ id: number }>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
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

		await revalidateClubPage(clubId)

		return { success: true, data: { id: result[0].insertId } }
	} catch (error) {
		console.error("Failed to add club contact:", error)
		return { success: false, error: "Failed to add club contact" }
	}
}

export async function removeClubContactForContact(
	clubId: number,
	clubContactId: number,
): Promise<ActionResult> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	try {
		// Verify the club contact belongs to this club
		const rows = await db
			.select({ id: clubContact.id })
			.from(clubContact)
			.where(and(eq(clubContact.id, clubContactId), eq(clubContact.clubId, clubId)))

		if (rows.length === 0) {
			return { success: false, error: "Club contact not found" }
		}

		await db.transaction(async (tx) => {
			await tx.delete(clubContactRole).where(eq(clubContactRole.clubContactId, clubContactId))
			await tx.delete(clubContact).where(eq(clubContact.id, clubContactId))
		})
		await revalidateClubPage(clubId)
		return { success: true }
	} catch (error) {
		console.error("Failed to remove club contact:", error)
		return { success: false, error: "Failed to remove club contact" }
	}
}

export async function toggleClubContactPrimaryForContact(
	clubId: number,
	clubContactId: number,
): Promise<ActionResult> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	try {
		const rows = await db
			.select({ isPrimary: clubContact.isPrimary })
			.from(clubContact)
			.where(and(eq(clubContact.id, clubContactId), eq(clubContact.clubId, clubId)))

		const row = rows[0]
		if (!row) {
			return { success: false, error: "Club contact not found" }
		}

		await db
			.update(clubContact)
			.set({ isPrimary: !row.isPrimary })
			.where(eq(clubContact.id, clubContactId))

		await revalidateClubPage(clubId)

		return { success: true }
	} catch (error) {
		console.error("Failed to toggle primary contact:", error)
		return { success: false, error: "Failed to toggle primary contact" }
	}
}

// ── Club Contact Roles ──────────────────────────────────────────────

export async function addClubContactRoleForContact(
	clubId: number,
	clubContactId: number,
	role: string,
): Promise<ActionResult<{ id: number }>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	try {
		// Verify the club contact belongs to this club
		const owner = await db
			.select({ id: clubContact.id })
			.from(clubContact)
			.where(and(eq(clubContact.id, clubContactId), eq(clubContact.clubId, clubId)))

		if (owner.length === 0) {
			return { success: false, error: "Club contact not found" }
		}

		const result = await db.insert(clubContactRole).values({
			clubContactId,
			role,
		})

		await revalidateClubPage(clubId)

		return { success: true, data: { id: result[0].insertId } }
	} catch (error) {
		console.error("Failed to add role:", error)
		return { success: false, error: "Failed to add role" }
	}
}

export async function removeClubContactRoleForContact(
	clubId: number,
	roleId: number,
): Promise<ActionResult> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	try {
		// Verify the role belongs to a club contact of this club
		const rows = await db
			.select({ id: clubContactRole.id })
			.from(clubContactRole)
			.innerJoin(clubContact, eq(clubContactRole.clubContactId, clubContact.id))
			.where(and(eq(clubContactRole.id, roleId), eq(clubContact.clubId, clubId)))

		if (rows.length === 0) {
			return { success: false, error: "Role not found" }
		}

		await db.delete(clubContactRole).where(eq(clubContactRole.id, roleId))
		await revalidateClubPage(clubId)
		return { success: true }
	} catch (error) {
		console.error("Failed to remove role:", error)
		return { success: false, error: "Failed to remove role" }
	}
}

// ── Dues Payment ────────────────────────────────────────────────────

export async function getClubDuesStatusForContact(
	clubId: number,
): Promise<ActionResult<ClubDuesStatus>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	const currentYear = new Date().getFullYear()

	try {
		const clubs = await db.select({ name: club.name }).from(club).where(eq(club.id, clubId))

		const clubRow = clubs[0]
		if (!clubRow) {
			return { success: false, error: "Club not found" }
		}

		const memberships = await db
			.select({ paymentDate: membership.paymentDate })
			.from(membership)
			.where(and(eq(membership.clubId, clubId), eq(membership.year, currentYear)))

		const existing = memberships[0]

		return {
			success: true,
			data: {
				clubName: clubRow.name,
				year: currentYear,
				isPaid: !!existing,
				paymentDate: existing?.paymentDate ?? null,
			},
		}
	} catch (error) {
		console.error("Failed to get dues status:", error)
		return { success: false, error: "Failed to get dues status" }
	}
}

export async function createPaymentIntentForContact(
	clubId: number,
): Promise<ActionResult<{ clientSecret: string }>> {
	const authCheck = await requireClubContactAuth(clubId)
	if (!authCheck.authorized) {
		return { success: false, error: authCheck.error }
	}

	const currentYear = new Date().getFullYear()

	try {
		const existing = await db
			.select({ id: membership.id })
			.from(membership)
			.where(and(eq(membership.clubId, clubId), eq(membership.year, currentYear)))

		if (existing.length > 0) {
			return { success: false, error: "Dues have already been paid for this year" }
		}

		const paymentIntent = await getStripe().paymentIntents.create(
			{
				amount: 10000,
				currency: "usd",
				metadata: {
					clubId: String(clubId),
					year: String(currentYear),
				},
			},
			{ idempotencyKey: `dues-${clubId}-${currentYear}` },
		)

		if (!paymentIntent.client_secret) {
			return { success: false, error: "Failed to create payment" }
		}

		return { success: true, data: { clientSecret: paymentIntent.client_secret } }
	} catch (error) {
		console.error("Failed to create payment intent:", error)
		return { success: false, error: "Failed to create payment intent" }
	}
}
