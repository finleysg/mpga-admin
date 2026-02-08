import { headers } from "next/headers"

import { auth } from "@/lib/auth"

export async function requireAuth(): Promise<string | null> {
	const headersList = await headers()
	const session = await auth.api.getSession({ headers: headersList })

	if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
		return null
	}

	return session.user.id
}

export async function requireSuperAdmin(): Promise<string | null> {
	const headersList = await headers()
	const session = await auth.api.getSession({ headers: headersList })

	if (!session?.user || session.user.role !== "super_admin") {
		return null
	}

	return session.user.id
}
