import crypto from "crypto"

import { invitation, user, account } from "@mpga/database"
import { hashPassword } from "better-auth/crypto"
import { eq, and, gt } from "drizzle-orm"

import { db } from "./db"
import { sendInvitationEmail } from "./email"

/**
 * Hashes a token using SHA-256 for secure storage.
 */
function hashToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex")
}

/**
 * Creates an invitation for the given email address.
 * Generates a crypto-random token, stores the hashed version,
 * and sends an invitation email with the plain token.
 */
export async function createInvitation(email: string, invitedByUserId: string): Promise<void> {
	const id = crypto.randomUUID()
	const plainToken = crypto.randomBytes(32).toString("hex")
	const hashedToken = hashToken(plainToken)

	const now = new Date()
	const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

	await db.insert(invitation).values({
		id,
		email,
		token: hashedToken,
		invitedBy: invitedByUserId,
		role: "admin",
		status: "pending",
		expiresAt,
		createdAt: now,
	})

	await sendInvitationEmail(email, plainToken)
}

/**
 * Validates an invitation token.
 * Returns the invitation record if valid, null otherwise.
 */
export async function validateInvitation(token: string) {
	const hashedToken = hashToken(token)
	const now = new Date()

	const results = await db
		.select()
		.from(invitation)
		.where(
			and(
				eq(invitation.token, hashedToken),
				eq(invitation.status, "pending"),
				gt(invitation.expiresAt, now),
			),
		)

	return results[0] ?? null
}

/**
 * Accepts an invitation by updating its status and setting the acceptedAt timestamp.
 * Returns true if a pending invitation was found and accepted, false otherwise.
 */
export async function acceptInvitation(token: string): Promise<boolean> {
	const hashedToken = hashToken(token)
	const now = new Date()

	const result = await db
		.update(invitation)
		.set({
			status: "accepted",
			acceptedAt: now,
		})
		.where(
			and(
				eq(invitation.token, hashedToken),
				eq(invitation.status, "pending"),
				gt(invitation.expiresAt, now),
			),
		)

	return result[0].affectedRows > 0
}

/** Provision an account and consume its invitation atomically. Public auth signup is disabled. */
export async function registerInvitedUser(token: string, name: string, password: string) {
	if (!name.trim() || name.length > 255 || password.length < 8 || password.length > 128) {
		throw new Error("Enter a name and a password between 8 and 128 characters.")
	}
	if (!token || token.length > 256) throw new Error("This invitation is invalid or has expired.")
	const passwordHash = await hashPassword(password)
	return db.transaction(async (tx) => {
		const now = new Date()
		const [inv] = await tx
			.select()
			.from(invitation)
			.where(
				and(
					eq(invitation.token, hashToken(token)),
					eq(invitation.status, "pending"),
					gt(invitation.expiresAt, now),
				),
			)
			.for("update")
		if (!inv || inv.role !== "admin") throw new Error("This invitation is invalid or has expired.")
		const id = crypto.randomUUID()
		await tx.insert(user).values({
			id,
			name: name.trim(),
			email: inv.email.toLowerCase(),
			emailVerified: true,
			role: "admin",
			createdAt: now,
			updatedAt: now,
		})
		await tx.insert(account).values({
			id: crypto.randomUUID(),
			userId: id,
			accountId: id,
			providerId: "credential",
			password: passwordHash,
			createdAt: now,
			updatedAt: now,
		})
		await tx
			.update(invitation)
			.set({ status: "accepted", acceptedAt: now })
			.where(eq(invitation.id, inv.id))
		return { email: inv.email.toLowerCase() }
	})
}
