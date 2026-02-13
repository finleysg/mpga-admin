import { adminClient, magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { ac, adminRole, superAdminRole } from "./permissions"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:4100",
	plugins: [
		adminClient({
			ac,
			roles: {
				super_admin: superAdminRole,
				admin: adminRole,
			},
		}),
		magicLinkClient(),
	],
})

export const { signIn, signOut, signUp, useSession } = authClient
