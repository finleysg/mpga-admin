"use server"

import { user } from "@mpga/database"
import type { ActionResult } from "@mpga/types"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/require-auth"
import { isAssignableRole, isRoleDowngrade, type AssignableRole } from "@/lib/roles"

interface UserData {
	id: string
	name: string | null
	email: string
	role: string | null
	banned: boolean | null
	createdAt: Date
}

export async function listUsersAction(): Promise<ActionResult<UserData[]>> {
	const userId = await requireSuperAdmin()
	if (!userId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const headersList = await headers()
		const response = await auth.api.listUsers({
			headers: headersList,
			query: { limit: 100 },
		})

		return { success: true, data: response.users as UserData[] }
	} catch (error) {
		console.error("Failed to list users:", error)
		return { success: false, error: "Failed to list users" }
	}
}

export async function banUserAction(userId: string, ban: boolean): Promise<ActionResult> {
	const adminId = await requireSuperAdmin()
	if (!adminId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const headersList = await headers()
		if (ban) {
			await auth.api.banUser({ headers: headersList, body: { userId } })
		} else {
			await auth.api.unbanUser({ headers: headersList, body: { userId } })
		}
		return { success: true }
	} catch (error) {
		console.error("Failed to update ban status:", error)
		return { success: false, error: "Failed to update ban status" }
	}
}

export async function setRoleAction(userId: string, role: AssignableRole): Promise<ActionResult> {
	const adminId = await requireSuperAdmin()
	if (!adminId) {
		return { success: false, error: "Unauthorized" }
	}
	if (!isAssignableRole(role)) {
		return { success: false, error: "Invalid role" }
	}
	if (userId === adminId) {
		return { success: false, error: "You can't change your own role" }
	}

	try {
		const headersList = await headers()
		const [existing] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId))
		await auth.api.setRole({ headers: headersList, body: { userId, role } })
		// Losing access takes effect immediately: end the user's open sessions.
		if (isRoleDowngrade(existing?.role, role)) {
			await auth.api.revokeUserSessions({ headers: headersList, body: { userId } })
		}
		return { success: true }
	} catch (error) {
		console.error("Failed to set role:", error)
		return { success: false, error: "Failed to set role" }
	}
}

export async function removeUserAction(userId: string): Promise<ActionResult> {
	const adminId = await requireSuperAdmin()
	if (!adminId) {
		return { success: false, error: "Unauthorized" }
	}

	try {
		const headersList = await headers()
		await auth.api.removeUser({ headers: headersList, body: { userId } })
		return { success: true }
	} catch (error) {
		console.error("Failed to remove user:", error)
		return { success: false, error: "Failed to remove user" }
	}
}
