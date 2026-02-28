"use server"

import { clubContactRole, role } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

export interface RoleData {
	id: number
	name: string
}

export async function listRolesAction(): Promise<ActionResult<RoleData[]>> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const results = await db
			.select({
				id: role.id,
				name: role.name,
			})
			.from(role)
			.orderBy(asc(role.name))

		return { success: true, data: results }
	} catch (error) {
		console.error("Failed to list roles:", error)
		return { success: false, error: "Failed to list roles" }
	}
}

export async function saveRoleAction(data: {
	id?: number
	name: string
}): Promise<ActionResult<{ id: number }>> {
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
			await db.update(role).set({ name }).where(eq(role.id, data.id))
			return { success: true, data: { id: data.id } }
		} else {
			const result = await db.insert(role).values({ name })
			return { success: true, data: { id: result[0].insertId } }
		}
	} catch (error) {
		console.error("Failed to save role:", error)
		return { success: false, error: "Failed to save role" }
	}
}

export async function deleteRoleAction(id: number): Promise<ActionResult> {
	const userId = await requireAuth()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const inUse = await db
			.select({ id: clubContactRole.id })
			.from(clubContactRole)
			.where(eq(clubContactRole.roleId, id))
			.limit(1)

		if (inUse.length > 0) {
			return {
				success: false,
				error: "Cannot delete: this role is assigned to one or more contacts",
			}
		}

		await db.delete(role).where(eq(role.id, id))
		return { success: true }
	} catch (error) {
		console.error("Failed to delete role:", error)
		return { success: false, error: "Failed to delete role" }
	}
}
