"use server"

import { auth } from "@/lib/auth"
import { acceptInvitation, validateInvitation } from "@/lib/invitation"

export async function signUpWithInvitation(token: string, name: string, password: string) {
	const invitation = await validateInvitation(token)
	if (!invitation) {
		return { success: false, error: "This invitation is invalid or has expired." }
	}

	const result = await auth.api.signUpEmail({
		body: {
			email: invitation.email,
			password,
			name,
		},
	})

	if (!result?.user) {
		return { success: false, error: "Account creation failed." }
	}

	const accepted = await acceptInvitation(token)
	if (!accepted) {
		return {
			success: false,
			error:
				"Your account was created but the invitation could not be accepted. Please contact an administrator.",
		}
	}

	return { success: true }
}
