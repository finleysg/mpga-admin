"use server"

import { auth } from "@/lib/auth"
import { registerInvitedUser } from "@/lib/invitation"

export async function signUpWithInvitation(token: string, name: string, password: string) {
	let email: string
	try {
		;({ email } = await registerInvitedUser(token, name, password))
	} catch {
		return {
			success: false,
			error:
				"Account creation failed. Check your invitation and use a password between 8 and 128 characters.",
		}
	}
	try {
		await auth.api.signInEmail({ body: { email, password } })
	} catch {
		return {
			success: false,
			error: "Your account was created. Please sign in from the login page.",
		}
	}
	return { success: true }
}
