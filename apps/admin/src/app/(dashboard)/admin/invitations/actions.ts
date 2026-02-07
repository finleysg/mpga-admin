"use server";

import { invitation } from "@mpga/database";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvitation } from "@/lib/invitation";

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

interface InvitationData {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

async function requireSuperAdmin(): Promise<string | null> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user || session.user.role !== "super_admin") {
    return null;
  }

  return session.user.id;
}

export async function createInvitationAction(
  email: string,
): Promise<ActionResult> {
  const userId = await requireSuperAdmin();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await createInvitation(email, userId);
    return { success: true };
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return { success: false, error: "Failed to create invitation" };
  }
}

export async function listInvitationsAction(): Promise<
  ActionResult<InvitationData[]>
> {
  const userId = await requireSuperAdmin();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const results = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .orderBy(desc(invitation.createdAt));

    return { success: true, data: results };
  } catch (error) {
    console.error("Failed to list invitations:", error);
    return { success: false, error: "Failed to list invitations" };
  }
}

export async function revokeInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const userId = await requireSuperAdmin();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .update(invitation)
      .set({ status: "revoked" })
      .where(eq(invitation.id, invitationId));

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke invitation:", error);
    return { success: false, error: "Failed to revoke invitation" };
  }
}
