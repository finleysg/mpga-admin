import {
	club,
	clubContact,
	clubContactRole,
	contact,
	content,
	document,
	golfCourse,
	membership,
} from "@mpga/database"
import { ContentSystemName } from "@mpga/types"
import { eq, and, desc } from "drizzle-orm"

import { db } from "../db"

export interface MembersContent {
	title: string
	content: string
}

export async function getMembersContent(): Promise<MembersContent | null> {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.MemberClubs))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch members content:", error)
		return null
	}
}

export interface ClubWithMembershipStatus {
	id: number
	name: string
	website: string
	systemName: string | null
	size: number | null
	isMember: boolean
}

export async function getClubsWithMembershipStatus(
	year: number,
): Promise<ClubWithMembershipStatus[]> {
	try {
		const results = await db
			.select({
				id: club.id,
				name: club.name,
				website: club.website,
				systemName: club.systemName,
				size: club.size,
				membershipId: membership.id,
			})
			.from(club)
			.leftJoin(membership, and(eq(club.id, membership.clubId), eq(membership.year, year)))
			.where(eq(club.archived, false))
			.orderBy(club.name)

		return results.map((r) => ({
			id: r.id,
			name: r.name,
			website: r.website,
			systemName: r.systemName,
			size: r.size,
			isMember: r.membershipId !== null,
		}))
	} catch (error) {
		console.error("Failed to fetch clubs with membership status:", error)
		return []
	}
}

export interface ClubDetail {
	id: number
	name: string
	website: string
	notes: string | null
	size: number | null
	golfCourse: {
		name: string
		address: string
		city: string
		state: string
		zip: string
		websiteUrl: string
		email: string
		phone: string
		notes: string | null
		logo: string
	} | null
}

export async function getClubBySystemName(systemName: string): Promise<ClubDetail | null> {
	try {
		const results = await db
			.select({
				id: club.id,
				name: club.name,
				website: club.website,
				notes: club.notes,
				size: club.size,
				courseName: golfCourse.name,
				courseAddress: golfCourse.addressText,
				courseCity: golfCourse.city,
				courseState: golfCourse.state,
				courseZip: golfCourse.zip,
				courseWebsiteUrl: golfCourse.websiteUrl,
				courseEmail: golfCourse.email,
				coursePhone: golfCourse.phone,
				courseNotes: golfCourse.notes,
				courseLogo: golfCourse.logo,
			})
			.from(club)
			.leftJoin(golfCourse, eq(club.golfCourseId, golfCourse.id))
			.where(eq(club.systemName, systemName))
			.limit(1)

		if (results.length === 0) {
			return null
		}

		const r = results[0]!
		return {
			id: r.id,
			name: r.name,
			website: r.website,
			notes: r.notes,
			size: r.size,
			golfCourse: r.courseName
				? {
						name: r.courseName,
						address: r.courseAddress!,
						city: r.courseCity!,
						state: r.courseState!,
						zip: r.courseZip!,
						websiteUrl: r.courseWebsiteUrl!,
						email: r.courseEmail!,
						phone: r.coursePhone!,
						notes: r.courseNotes ?? null,
						logo: r.courseLogo!,
					}
				: null,
		}
	} catch (error) {
		console.error(`Failed to fetch club ${systemName}:`, error)
		return null
	}
}

export interface ClubOfficer {
	id: number
	firstName: string
	lastName: string
	email: string | null
	isPrimary: boolean
	roles: string[]
}

export async function getClubOfficers(clubId: number): Promise<ClubOfficer[]> {
	try {
		const results = await db
			.select({
				clubContactId: clubContact.id,
				firstName: contact.firstName,
				lastName: contact.lastName,
				email: contact.email,
				isPrimary: clubContact.isPrimary,
				role: clubContactRole.role,
			})
			.from(clubContact)
			.innerJoin(contact, eq(clubContact.contactId, contact.id))
			.leftJoin(clubContactRole, eq(clubContactRole.clubContactId, clubContact.id))
			.where(eq(clubContact.clubId, clubId))

		// Group by clubContact to aggregate roles
		const officerMap = new Map<number, ClubOfficer>()
		for (const r of results) {
			const existing = officerMap.get(r.clubContactId)
			if (existing) {
				if (r.role && !existing.roles.includes(r.role)) {
					existing.roles.push(r.role)
				}
			} else {
				officerMap.set(r.clubContactId, {
					id: r.clubContactId,
					firstName: r.firstName,
					lastName: r.lastName,
					email: r.email,
					isPrimary: r.isPrimary,
					roles: r.role ? [r.role] : [],
				})
			}
		}

		// Sort: primary contacts first, then alphabetically
		return Array.from(officerMap.values()).sort((a, b) => {
			if (a.isPrimary !== b.isPrimary) {
				return a.isPrimary ? -1 : 1
			}
			return a.lastName.localeCompare(b.lastName)
		})
	} catch (error) {
		console.error(`Failed to fetch club officers for ${clubId}:`, error)
		return []
	}
}

export interface ClubMembershipInfo {
	lastMemberYear: number | null
	currentYearPaymentDate: string | null
}

export async function getClubMembershipInfo(
	clubId: number,
	currentYear: number,
): Promise<ClubMembershipInfo> {
	try {
		// Get all memberships for this club, ordered by year descending
		const results = await db
			.select({
				year: membership.year,
				paymentDate: membership.paymentDate,
			})
			.from(membership)
			.where(eq(membership.clubId, clubId))
			.orderBy(desc(membership.year))

		const lastMemberYear = results.length > 0 ? results[0]!.year : null
		const currentYearMembership = results.find((r) => r.year === currentYear)
		const currentYearPaymentDate = currentYearMembership?.paymentDate ?? null

		return {
			lastMemberYear,
			currentYearPaymentDate,
		}
	} catch (error) {
		console.error(`Failed to fetch membership info for club ${clubId}:`, error)
		return {
			lastMemberYear: null,
			currentYearPaymentDate: null,
		}
	}
}

export interface ClubRegistrationDocument {
	id: number
	title: string
	file: string
}

export async function getClubRegistrationDocument(
	year: number,
): Promise<ClubRegistrationDocument | null> {
	try {
		const results = await db
			.select({
				id: document.id,
				title: document.title,
				file: document.file,
			})
			.from(document)
			.where(and(eq(document.documentType, "Club Registration"), eq(document.year, year)))
			.limit(1)

		const doc = results[0]
		if (!doc?.file) return null

		return {
			id: doc.id,
			title: doc.title,
			file: doc.file,
		}
	} catch (error) {
		console.error("Failed to fetch club registration document:", error)
		return null
	}
}
