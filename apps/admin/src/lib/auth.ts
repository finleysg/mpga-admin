import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, magicLink } from "better-auth/plugins"

import { db } from "./db"
import { sendMagicLinkEmail } from "./email"
import { ac, adminRole, superAdminRole } from "./permissions"

export const auth = betterAuth({
	logger: {
		level: "info",
	},
	baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_ADMIN_URL,
	trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? ["http://localhost:4100"],
	database: drizzleAdapter(db, {
		provider: "mysql",
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	plugins: [
		admin({
			defaultRole: "admin",
			adminRoles: ["super_admin", "admin"],
			ac,
			roles: {
				super_admin: superAdminRole,
				admin: adminRole,
			},
		}),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				await sendMagicLinkEmail(email, url)
			},
			expiresIn: 600,
		}),
	],
})
