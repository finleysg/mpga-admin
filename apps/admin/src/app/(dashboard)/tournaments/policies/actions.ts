"use server";

import { content } from "@mpga/database";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/require-auth";

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ContentData {
  id: number;
  contentType: string;
  title: string;
  contentText: string;
}

export async function getContentAction(
  contentType: string,
): Promise<ActionResult<ContentData>> {
  const userId = await requireAuth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const results = await db
      .select({
        id: content.id,
        contentType: content.contentType,
        title: content.title,
        contentText: content.contentText,
      })
      .from(content)
      .where(eq(content.contentType, contentType));

    if (results.length === 0) {
      return { success: true };
    }

    return { success: true, data: results[0] };
  } catch (error) {
    console.error("Failed to get content:", error);
    return { success: false, error: "Failed to get content" };
  }
}

export async function saveContentAction(data: {
  id?: number;
  contentType: string;
  title: string;
  contentText: string;
}): Promise<ActionResult<{ id: number }>> {
  const userId = await requireAuth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const title = data.title?.trim();
  if (!title) {
    return { success: false, error: "Title is required" };
  }

  try {
    let id: number;

    if (data.id !== undefined) {
      await db
        .update(content)
        .set({
          title,
          contentText: data.contentText,
        })
        .where(eq(content.id, data.id));
      id = data.id;
    } else {
      const result = await db.insert(content).values({
        contentType: data.contentType,
        title,
        contentText: data.contentText,
      });
      id = result[0].insertId;
    }

    // Revalidate the public site
    await revalidatePublicSite("/tournaments");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to save content:", error);
    return { success: false, error: "Failed to save content" };
  }
}

async function revalidatePublicSite(path: string) {
  const publicUrl = process.env.PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!publicUrl || !secret) {
    console.warn(
      "PUBLIC_SITE_URL or REVALIDATE_SECRET not configured, skipping revalidation",
    );
    return;
  }

  try {
    await fetch(
      `${publicUrl}/api/revalidate?path=${encodeURIComponent(path)}`,
      {
        method: "POST",
        headers: { "x-revalidate-secret": secret },
      },
    );
  } catch (error) {
    console.error("Failed to revalidate public site:", error);
  }
}
