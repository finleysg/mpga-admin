import { content } from "@mpga/database";
import { eq, inArray } from "drizzle-orm";

import { db } from "../db";

export interface FeatureCard {
  contentType: string;
  title: string;
  description: string;
}

export interface AboutContent {
  title: string;
  content: string;
}

export async function getFeatureCards(): Promise<FeatureCard[]> {
  try {
    const results = await db
      .select({
        contentType: content.contentType,
        title: content.title,
        description: content.contentText,
      })
      .from(content)
      .where(inArray(content.contentType, ["T1", "M1", "C1"]));

    return results;
  } catch (error) {
    console.error("Failed to fetch feature cards:", error);
    return [];
  }
}

export async function getAboutContent(): Promise<AboutContent | null> {
  try {
    const results = await db
      .select({
        title: content.title,
        content: content.contentText,
      })
      .from(content)
      .where(eq(content.contentType, "H"))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error("Failed to fetch about content:", error);
    return null;
  }
}

export async function getMatchPlayContent(): Promise<AboutContent | null> {
  try {
    const results = await db
      .select({
        title: content.title,
        content: content.contentText,
      })
      .from(content)
      .where(eq(content.contentType, "M"))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error("Failed to fetch match play content:", error);
    return null;
  }
}

export async function getMatchPlayRules(): Promise<AboutContent | null> {
  try {
    const results = await db
      .select({
        title: content.title,
        content: content.contentText,
      })
      .from(content)
      .where(eq(content.contentType, "MP"))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error("Failed to fetch match play rules:", error);
    return null;
  }
}

export async function getSeniorMatchPlayRules(): Promise<AboutContent | null> {
  try {
    const results = await db
      .select({
        title: content.title,
        content: content.contentText,
      })
      .from(content)
      .where(eq(content.contentType, "SP"))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error("Failed to fetch senior match play rules:", error);
    return null;
  }
}

export async function getTournamentPolicies(): Promise<AboutContent | null> {
  try {
    const results = await db
      .select({
        title: content.title,
        content: content.contentText,
      })
      .from(content)
      .where(eq(content.contentType, "TP"))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error("Failed to fetch tournament policies:", error);
    return null;
  }
}
