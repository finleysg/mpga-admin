"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: Date;
}

async function requireSuperAdmin(): Promise<string | null> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user || session.user.role !== "super_admin") {
    return null;
  }

  return session.user.id;
}

export async function listUsersAction(): Promise<ActionResult<UserData[]>> {
  const userId = await requireSuperAdmin();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const headersList = await headers();
    const response = await auth.api.listUsers({
      headers: headersList,
      query: { limit: 100 },
    });

    return { success: true, data: response.users as UserData[] };
  } catch (error) {
    console.error("Failed to list users:", error);
    return { success: false, error: "Failed to list users" };
  }
}

export async function banUserAction(
  userId: string,
  ban: boolean,
): Promise<ActionResult> {
  const adminId = await requireSuperAdmin();
  if (!adminId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const headersList = await headers();
    if (ban) {
      await auth.api.banUser({ headers: headersList, body: { userId } });
    } else {
      await auth.api.unbanUser({ headers: headersList, body: { userId } });
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to update ban status:", error);
    return { success: false, error: "Failed to update ban status" };
  }
}

export async function setRoleAction(
  userId: string,
  role: "admin" | "super_admin",
): Promise<ActionResult> {
  const adminId = await requireSuperAdmin();
  if (!adminId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const headersList = await headers();
    await auth.api.setRole({ headers: headersList, body: { userId, role } });
    return { success: true };
  } catch (error) {
    console.error("Failed to set role:", error);
    return { success: false, error: "Failed to set role" };
  }
}

export async function removeUserAction(userId: string): Promise<ActionResult> {
  const adminId = await requireSuperAdmin();
  if (!adminId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const headersList = await headers();
    await auth.api.removeUser({ headers: headersList, body: { userId } });
    return { success: true };
  } catch (error) {
    console.error("Failed to remove user:", error);
    return { success: false, error: "Failed to remove user" };
  }
}
