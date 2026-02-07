import {
  tournament,
  tournamentInstance,
  tournamentLink,
  tournamentHistory,
  document,
  photo,
  golfCourse,
} from "@mpga/database";
import { eq, and, gte, lt, asc, desc } from "drizzle-orm";

import { db } from "../db";

export interface TournamentForYear {
  tournamentId: number;
  tournamentName: string;
  tournamentDescription: string;
  systemName: string | null;
  instanceId: number;
  instanceName: string;
  startDate: string;
  rounds: number;
  venueName: string;
  venueCity: string;
  venueState: string;
  venueLogo: string;
}

export async function getTournamentsForYear(
  year: number,
): Promise<TournamentForYear[]> {
  try {
    const results = await db
      .select({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        tournamentDescription: tournament.description,
        systemName: tournament.systemName,
        instanceId: tournamentInstance.id,
        instanceName: tournamentInstance.name,
        startDate: tournamentInstance.startDate,
        rounds: tournamentInstance.rounds,
        venueName: golfCourse.name,
        venueCity: golfCourse.city,
        venueState: golfCourse.state,
        venueLogo: golfCourse.logo,
      })
      .from(tournamentInstance)
      .innerJoin(tournament, eq(tournamentInstance.tournamentId, tournament.id))
      .innerJoin(golfCourse, eq(tournamentInstance.locationId, golfCourse.id))
      .where(
        and(
          gte(tournamentInstance.startDate, `${year}-01-01`),
          lt(tournamentInstance.startDate, `${year + 1}-01-01`),
        ),
      )
      .orderBy(asc(tournamentInstance.startDate));

    return results;
  } catch (error) {
    console.error(`Failed to fetch ${year} tournaments:`, error);
    return [];
  }
}

/** @deprecated Use getTournamentsForYear(2026) instead */
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

/** @deprecated Use getTournamentsForYear(2026) instead */
export async function get2026Tournaments(): Promise<Tournament2026[]> {
  const results = await getTournamentsForYear(2026);
  return results.map((t) => ({
    tournamentId: t.tournamentId,
    tournamentName: t.tournamentName,
    systemName: t.systemName,
    instanceId: t.instanceId,
    instanceName: t.instanceName,
    startDate: t.startDate,
    rounds: t.rounds,
    venueName: t.venueName,
    venueCity: t.venueCity,
  }));
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

export interface TournamentInstanceDetail {
  instanceId: number;
  instanceName: string;
  instanceDescription: string;
  instanceNotes: string | null;
  startDate: string;
  rounds: number;
  registrationStart: string | null;
  registrationEnd: string | null;
  tournamentId: number;
  tournamentName: string;
  tournamentDescription: string;
  systemName: string | null;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  venueZip: string;
  venueWebsiteUrl: string;
  venueEmail: string;
  venuePhone: string;
  venueNotes: string | null;
  venueLogo: string;
}

export async function getTournamentInstance(
  systemName: string,
  year: number,
): Promise<TournamentInstanceDetail | null> {
  try {
    const results = await db
      .select({
        instanceId: tournamentInstance.id,
        instanceName: tournamentInstance.name,
        instanceDescription: tournamentInstance.description,
        instanceNotes: tournamentInstance.notes,
        startDate: tournamentInstance.startDate,
        rounds: tournamentInstance.rounds,
        registrationStart: tournamentInstance.registrationStart,
        registrationEnd: tournamentInstance.registrationEnd,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        tournamentDescription: tournament.description,
        systemName: tournament.systemName,
        venueName: golfCourse.name,
        venueAddress: golfCourse.addressText,
        venueCity: golfCourse.city,
        venueState: golfCourse.state,
        venueZip: golfCourse.zip,
        venueWebsiteUrl: golfCourse.websiteUrl,
        venueEmail: golfCourse.email,
        venuePhone: golfCourse.phone,
        venueNotes: golfCourse.notes,
        venueLogo: golfCourse.logo,
      })
      .from(tournamentInstance)
      .innerJoin(tournament, eq(tournamentInstance.tournamentId, tournament.id))
      .innerJoin(golfCourse, eq(tournamentInstance.locationId, golfCourse.id))
      .where(
        and(
          eq(tournament.systemName, systemName),
          gte(tournamentInstance.startDate, `${year}-01-01`),
          lt(tournamentInstance.startDate, `${year + 1}-01-01`),
        ),
      )
      .limit(1);

    return results[0] ?? null;
  } catch (error) {
    console.error(
      `Failed to fetch tournament instance ${systemName}/${year}:`,
      error,
    );
    return null;
  }
}

export interface TournamentLinkData {
  id: number;
  linkType: string;
  url: string;
  title: string;
}

export async function getTournamentLinks(
  instanceId: number,
): Promise<TournamentLinkData[]> {
  try {
    const results = await db
      .select({
        id: tournamentLink.id,
        linkType: tournamentLink.linkType,
        url: tournamentLink.url,
        title: tournamentLink.title,
      })
      .from(tournamentLink)
      .where(eq(tournamentLink.tournamentInstanceId, instanceId));

    return results;
  } catch (error) {
    console.error(`Failed to fetch tournament links for ${instanceId}:`, error);
    return [];
  }
}

export interface TournamentDocumentData {
  id: number;
  documentType: string;
  title: string;
  file: string | null;
}

export async function getTournamentDocuments(
  tournamentId: number,
  year: number,
): Promise<TournamentDocumentData[]> {
  try {
    const results = await db
      .select({
        id: document.id,
        documentType: document.documentType,
        title: document.title,
        file: document.file,
      })
      .from(document)
      .where(
        and(eq(document.tournamentId, tournamentId), eq(document.year, year)),
      );

    return results;
  } catch (error) {
    console.error(
      `Failed to fetch tournament documents for ${tournamentId}/${year}:`,
      error,
    );
    return [];
  }
}

export interface TournamentBaseInfo {
  id: number;
  name: string;
  description: string;
}

export async function getTournamentBySystemName(
  systemName: string,
): Promise<TournamentBaseInfo | null> {
  try {
    const results = await db
      .select({
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
      })
      .from(tournament)
      .where(eq(tournament.systemName, systemName))
      .limit(1);

    return results[0] ?? null;
  } catch (error) {
    console.error(`Failed to fetch tournament ${systemName}:`, error);
    return null;
  }
}

export interface TournamentHistoryRecord {
  id: number;
  year: number;
  location: string;
  winner: string;
  winnerClub: string;
  coWinner: string | null;
  coWinnerClub: string | null;
  division: string;
  score: string;
  isMatch: boolean;
  isNet: boolean;
}

export async function getTournamentHistory(
  tournamentId: number,
): Promise<TournamentHistoryRecord[]> {
  try {
    const results = await db
      .select({
        id: tournamentHistory.id,
        year: tournamentHistory.year,
        location: tournamentHistory.location,
        winner: tournamentHistory.winner,
        winnerClub: tournamentHistory.winnerClub,
        coWinner: tournamentHistory.coWinner,
        coWinnerClub: tournamentHistory.coWinnerClub,
        division: tournamentHistory.division,
        score: tournamentHistory.score,
        isMatch: tournamentHistory.isMatch,
        isNet: tournamentHistory.isNet,
      })
      .from(tournamentHistory)
      .where(eq(tournamentHistory.tournamentId, tournamentId))
      .orderBy(desc(tournamentHistory.year));

    return results.map((r) => ({
      ...r,
      coWinner: r.coWinner || null,
      coWinnerClub: r.coWinnerClub || null,
      isMatch: r.isMatch,
      isNet: r.isNet,
    }));
  } catch (error) {
    console.error(
      `Failed to fetch tournament history for ${tournamentId}:`,
      error,
    );
    return [];
  }
}

export interface TournamentPhotoRecord {
  id: number;
  rawImage: string;
  caption: string;
  year: number;
}

export async function getTournamentPhotos(
  tournamentId: number,
): Promise<TournamentPhotoRecord[]> {
  try {
    const results = await db
      .select({
        id: photo.id,
        rawImage: photo.rawImage,
        caption: photo.caption,
        year: photo.year,
      })
      .from(photo)
      .where(eq(photo.tournamentId, tournamentId))
      .orderBy(desc(photo.year));

    return results;
  } catch (error) {
    console.error(
      `Failed to fetch tournament photos for ${tournamentId}:`,
      error,
    );
    return [];
  }
}

export async function getTournamentHistoryDocuments(
  tournamentId: number,
): Promise<TournamentDocumentData[]> {
  try {
    const results = await db
      .select({
        id: document.id,
        documentType: document.documentType,
        title: document.title,
        file: document.file,
      })
      .from(document)
      .where(eq(document.tournamentId, tournamentId))
      .orderBy(desc(document.id));

    return results;
  } catch (error) {
    console.error(
      `Failed to fetch tournament history documents for ${tournamentId}:`,
      error,
    );
    return [];
  }
}
