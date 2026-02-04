import { tournament, tournamentInstance, golfCourse } from "@mpga/database";
import { eq, and, gte, lt, asc } from "drizzle-orm";

import { db } from "../db";

export interface Tournament2026 {
  tournamentId: number;
  tournamentName: string;
  systemName: string | null;
  instanceId: number;
  instanceName: string;
  startDate: string;
  rounds: number;
  venueName: string;
  venueCity: string;
}

export async function get2026Tournaments(): Promise<Tournament2026[]> {
  try {
    const results = await db
      .select({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        systemName: tournament.systemName,
        instanceId: tournamentInstance.id,
        instanceName: tournamentInstance.name,
        startDate: tournamentInstance.startDate,
        rounds: tournamentInstance.rounds,
        venueName: golfCourse.name,
        venueCity: golfCourse.city,
      })
      .from(tournamentInstance)
      .innerJoin(tournament, eq(tournamentInstance.tournamentId, tournament.id))
      .innerJoin(golfCourse, eq(tournamentInstance.locationId, golfCourse.id))
      .where(
        and(
          gte(tournamentInstance.startDate, "2026-01-01"),
          lt(tournamentInstance.startDate, "2027-01-01"),
        ),
      )
      .orderBy(asc(tournamentInstance.startDate));

    return results;
  } catch (error) {
    console.error("Failed to fetch 2026 tournaments:", error);
    return [];
  }
}

export function formatTournamentDates(
  startDate: string,
  rounds: number,
): string {
  const parts = startDate.split("-").map(Number);
  const start = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
  };

  if (rounds === 1) {
    return start.toLocaleDateString("en-US", options);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + rounds - 1);

  const startMonth = start.toLocaleDateString("en-US", { month: "long" });
  const endMonth = end.toLocaleDateString("en-US", { month: "long" });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}`;
  }

  return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
}
