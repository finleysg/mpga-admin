import { eq } from "drizzle-orm"

import type { Database } from "./client"
import { content } from "./schema"

// Stored with the other public-site content controls; no schema migration is needed.
export const TOURNAMENT_SEASON_KEY = "tournament-season"

export async function getDisplayedTournamentSeason(
	db: Database,
	fallback: number,
): Promise<number> {
	const [row] = await db
		.select({ value: content.contentText })
		.from(content)
		.where(eq(content.systemName, TOURNAMENT_SEASON_KEY))
		.limit(1)
	return row && /^\d{4}$/.test(row.value) ? Number(row.value) : fallback
}
