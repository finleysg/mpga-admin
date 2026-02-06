import { announcement } from "@mpga/database";
import { desc } from "drizzle-orm";

import { db } from "../db";

export interface Announcement {
  id: number;
  title: string;
  text: string;
  createDate: string;
  externalUrl: string;
  externalName: string;
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  try {
    const results = await db
      .select({
        id: announcement.id,
        title: announcement.title,
        text: announcement.text,
        createDate: announcement.createDate,
        externalUrl: announcement.externalUrl,
        externalName: announcement.externalName,
      })
      .from(announcement)
      .orderBy(desc(announcement.createDate));

    return results;
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return [];
  }
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
        externalUrl: announcement.externalUrl,
        externalName: announcement.externalName,
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
