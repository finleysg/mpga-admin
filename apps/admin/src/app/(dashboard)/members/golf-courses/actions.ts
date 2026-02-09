"use server"

import { golfCourse } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

interface GolfCourseInput {
	id?: number
	name: string
	addressText: string
	city: string
	state: string
	zip: string
	websiteUrl: string
	email: string
	phone: string
	notes?: string | null
	logo: string
}

export interface GolfCourseData {
	id: number
	name: string
	addressText: string
	city: string
	state: string
	zip: string
	websiteUrl: string
	email: string
	phone: string
	notes: string | null
	logo: string
}

export async function listGolfCoursesAction(): Promise<ActionResult<GolfCourseData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: golfCourse.id,
				name: golfCourse.name,
				addressText: golfCourse.addressText,
				city: golfCourse.city,
				state: golfCourse.state,
				zip: golfCourse.zip,
				websiteUrl: golfCourse.websiteUrl,
				email: golfCourse.email,
				phone: golfCourse.phone,
				notes: golfCourse.notes,
				logo: golfCourse.logo,
			})
			.from(golfCourse)
			.orderBy(asc(golfCourse.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list golf courses:", error)
		return { success: false, error: "Failed to list golf courses" }
	}
}

export async function getGolfCourseAction(id: number): Promise<ActionResult<GolfCourseData>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: golfCourse.id,
				name: golfCourse.name,
				addressText: golfCourse.addressText,
				city: golfCourse.city,
				state: golfCourse.state,
				zip: golfCourse.zip,
				websiteUrl: golfCourse.websiteUrl,
				email: golfCourse.email,
				phone: golfCourse.phone,
				notes: golfCourse.notes,
				logo: golfCourse.logo,
			})
			.from(golfCourse)
			.where(eq(golfCourse.id, id))

		if (results.length === 0) {
			return { success: false, error: "Golf course not found" }
		}

		return { success: true, data: results[0] }
	} catch (error) {
		console.error("Failed to get golf course:", error)
		return { success: false, error: "Failed to get golf course" }
	}
}

export async function saveGolfCourseAction(
	data: GolfCourseInput,
): Promise<ActionResult<{ id: number }>> {
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
				.update(golfCourse)
				.set({
					name,
					addressText: data.addressText,
					city: data.city,
					state: data.state,
					zip: data.zip,
					websiteUrl: data.websiteUrl,
					email: data.email,
					phone: data.phone,
					notes: data.notes ?? null,
					logo: data.logo,
				})
				.where(eq(golfCourse.id, data.id))

			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(golfCourse).values({
				name,
				addressText: data.addressText,
				city: data.city,
				state: data.state,
				zip: data.zip,
				websiteUrl: data.websiteUrl,
				email: data.email,
				phone: data.phone,
				notes: data.notes ?? null,
				logo: data.logo,
			})

			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save golf course:", error)
		return { success: false, error: "Failed to save golf course" }
	}
}

export async function deleteGolfCourseAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		await db.delete(golfCourse).where(eq(golfCourse.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete golf course:", error)

		if (error instanceof Error && error.message.includes("foreign key constraint")) {
			return {
				success: false,
				error: "Cannot delete: this golf course is linked to a club or tournament",
			}
		}

		return { success: false, error: "Failed to delete golf course" }
	}
}
