import crypto from "crypto";

import { invitation } from "@mpga/database";
import { eq, and, gt } from "drizzle-orm";

import { db } from "./db";
import { sendInvitationEmail } from "./email";

/**
 * Hashes a token using SHA-256 for secure storage.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Compares two strings in constant time to prevent timing attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Creates an invitation for the given email address.
 * Generates a crypto-random token, stores the hashed version,
 * and sends an invitation email with the plain token.
 */
export async function createInvitation(
  email: string,
  invitedByUserId: string,
): Promise<void> {
  const id = crypto.randomUUID();
  const plainToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(plainToken);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(invitation).values({
    id,
    email,
    token: hashedToken,
    invitedBy: invitedByUserId,
    role: "admin",
    status: "pending",
    expiresAt,
    createdAt: now,
  });

  await sendInvitationEmail(email, plainToken);
}

/**
 * Validates an invitation token.
 * Returns the invitation record if valid, null otherwise.
 */
export async function validateInvitation(token: string) {
  const hashedToken = hashToken(token);
  const now = new Date();

  const results = await db
    .select()
    .from(invitation)
    .where(
      and(eq(invitation.status, "pending"), gt(invitation.expiresAt, now)),
    );

  // Find matching invitation using constant-time comparison
  for (const inv of results) {
    if (constantTimeCompare(inv.token, hashedToken)) {
      return inv;
    }
  }

  return null;
}

/**
 * Accepts an invitation by updating its status and setting the acceptedAt timestamp.
 */
export async function acceptInvitation(token: string): Promise<void> {
  const hashedToken = hashToken(token);

  await db
    .update(invitation)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
    })
    .where(eq(invitation.token, hashedToken));
}
