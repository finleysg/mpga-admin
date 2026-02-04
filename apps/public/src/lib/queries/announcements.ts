import { announcement } from "@mpga/database";
import { desc } from "drizzle-orm";

import { db } from "../db";

export interface Announcement {
  id: number;
  title: string;
  text: string;
  createDate: string;
}

export async function getLatestAnnouncements(
  limit = 3,
): Promise<Announcement[]> {
  try {
    const results = await db
      .select({
        id: announcement.id,
        title: announcement.title,
        text: announcement.text,
        createDate: announcement.createDate,
      })
      .from(announcement)
      .orderBy(desc(announcement.createDate))
      .limit(limit);

    return results;
  } catch (error) {
    console.error("Failed to fetch latest announcements:", error);
    return [];
  }
}
