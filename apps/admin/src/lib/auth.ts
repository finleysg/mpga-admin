import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin, emailOTP } from "better-auth/plugins"

import { db } from "./db"
import { sendPasswordResetEmail, sendSignInOtpEmail } from "./email"
import { ac, adminRole, boardRole, superAdminRole } from "./permissions"
import { isLibraryRole } from "./roles"

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
		disableSignUp: true,
		// Requested from /forgot-password or by a super admin on the users page.
		sendResetPassword: async ({ user, token }) => {
			const { role, banned } = user as { role?: string | null; banned?: boolean | null }
			// Portal users sign in with an emailed code. A reset would give them a password.
			if (!isLibraryRole(role) || banned) {
				console.warn(`Password reset skipped for ${user.id}: not an active admin-site account`)
				return
			}
			const appUrl = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:4100").replace(
				/\/$/,
				"",
			)
			await sendPasswordResetEmail(
				user.email,
				`${appUrl}/reset-password?token=${encodeURIComponent(token)}`,
			)
		},
		resetPasswordTokenExpiresIn: 60 * 60 * 24, // 24 hours, single use
		revokeSessionsOnPasswordReset: true,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	plugins: [
		admin({
			defaultRole: "user",
			adminRoles: ["super_admin", "admin"],
			ac,
			roles: {
				user: ac.newRole({}),
				super_admin: superAdminRole,
				admin: adminRole,
				board: boardRole,
			},
		}),
		emailOTP({
			disableSignUp: true,
			otpLength: 6,
			expiresIn: 600,
			sendVerificationOTP: async ({ email, otp, type }) => {
				if (type === "sign-in") {
					await sendSignInOtpEmail(email, otp)
				}
			},
		}),
		nextCookies(),
	],
})
