import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { isAdminRole, isLibraryRole } from "@/lib/roles"

export async function requireAuth(): Promise<string | null> {
	const headersList = await headers()
	const session = await auth.api.getSession({ headers: headersList })

	if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
		return null
	}

	return session.user.id
}

export async function requireAuthEmail(): Promise<string | null> {
	const headersList = await headers()
	const session = await auth.api.getSession({ headers: headersList })

	if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
		return null
	}

	return session.user.email
}

export async function requireSuperAdmin(): Promise<string | null> {
	const headersList = await headers()
	const session = await auth.api.getSession({ headers: headersList })

	if (!session?.user || session.user.role !== "super_admin") {
		return null
	}

	return session.user.id
}

export interface LibraryUser {
	id: string
	email: string
	name: string
	role: string
	/** Admins and super admins manage folders, access, renames, moves, deletes and restores. */
	isDocumentAdmin: boolean
}

/** Any board member or admin. Returns null when the caller may not use the library. */
export async function requireLibraryUser(): Promise<LibraryUser | null> {
	const headersList = await headers()
	const session = await auth.api.getSession({ headers: headersList })
	const role = session?.user?.role
	if (!session?.user || !role || !isLibraryRole(role)) return null
	return {
		id: session.user.id,
		email: session.user.email,
		name: session.user.name,
		role,
		isDocumentAdmin: isAdminRole(role),
	}
}

/** A library user who is also a document admin. */
export async function requireDocumentAdmin(): Promise<LibraryUser | null> {
	const libraryUser = await requireLibraryUser()
	return libraryUser?.isDocumentAdmin ? libraryUser : null
}
