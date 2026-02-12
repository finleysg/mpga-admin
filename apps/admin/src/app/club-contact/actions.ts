"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"

import { validateClubContact } from "./validate-contact"

export async function sendClubContactVerification(
	clubId: number,
	email: string,
	callbackPath: string,
): Promise<{ success?: boolean; error?: string }> {
	const isContact = await validateClubContact(clubId, email)
	if (!isContact) {
		return { error: "This email is not associated with a contact for this club." }
	}

	await auth.api.signInMagicLink({
		body: {
			email,
			callbackURL: callbackPath,
		},
		headers: await headers(),
	})

	return { success: true }
}
