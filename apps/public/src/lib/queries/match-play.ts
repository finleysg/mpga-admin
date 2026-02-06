import { club, team } from "@mpga/database";
import { eq } from "drizzle-orm";

import { db } from "../db";

export interface MatchPlayTeam {
  id: number;
  clubName: string;
  groupName: string;
  isSenior: boolean;
}

export async function getTeamsForYear(year: number): Promise<MatchPlayTeam[]> {
  try {
    const results = await db
      .select({
        id: team.id,
        clubName: club.name,
        groupName: team.groupName,
        isSenior: team.isSenior,
      })
      .from(team)
      .innerJoin(club, eq(team.clubId, club.id))
      .where(eq(team.year, year))
      .orderBy(team.groupName, club.name);

    return results.map((r) => ({
      ...r,
      isSenior: r.isSenior === 1,
    }));
  } catch (error) {
    console.error("Failed to fetch match play teams:", error);
    return [];
  }
}
