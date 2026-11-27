// Role rules shared by server code and client components. Keep this file free of server imports.

export const INVITABLE_ROLES = ["admin", "board"] as const
export type InvitableRole = (typeof INVITABLE_ROLES)[number]

export const ASSIGNABLE_ROLES = ["super_admin", "admin", "board"] as const
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export const ROLE_LABELS: Record<string, string> = {
	super_admin: "Super Admin",
	admin: "Admin",
	board: "Board",
	user: "No admin access",
}

export const LIBRARY_PATH = "/library"
/** Signed-in account settings (change password). Open to every admin-site role. */
export const ACCOUNT_PATH = "/account"

function isUnder(pathname: string, base: string): boolean {
	return pathname === base || pathname.startsWith(`${base}/`)
}

/** Admins and super admins: full admin access, and document admins in the library. */
export function isAdminRole(role: string | null | undefined): boolean {
	return role === "admin" || role === "super_admin"
}

/** Anyone who may use the board library. */
export function isLibraryRole(role: string | null | undefined): boolean {
	return isAdminRole(role) || role === "board"
}

/** Board members without admin access may only use the library. */
export function isBoardOnly(role: string | null | undefined): boolean {
	return role === "board"
}

export function isInvitableRole(role: unknown): role is InvitableRole {
	return typeof role === "string" && (INVITABLE_ROLES as readonly string[]).includes(role)
}

export function isAssignableRole(role: unknown): role is AssignableRole {
	return typeof role === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(role)
}

const ROLE_RANK: Record<string, number> = { super_admin: 3, admin: 2, board: 1 }

/** True when moving from `from` to `to` takes away access, so open sessions should end. */
export function isRoleDowngrade(from: string | null | undefined, to: string): boolean {
	return (ROLE_RANK[to] ?? 0) < (ROLE_RANK[from ?? ""] ?? 0)
}

/** Where a signed-in user should be sent instead of `pathname`, or null if they may stay. */
export function dashboardRedirect(
	role: string | null | undefined,
	pathname: string,
): string | null {
	if (isAdminRole(role)) return null
	if (isBoardOnly(role)) {
		const allowed = isUnder(pathname, LIBRARY_PATH) || isUnder(pathname, ACCOUNT_PATH)
		return allowed ? null : LIBRARY_PATH
	}
	// Portal users (club contacts, captains) and users without a role have no dashboard access.
	return "/login?denied=1"
}
