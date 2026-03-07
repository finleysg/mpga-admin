import { H1 } from "@mpga/ui"

import { getTeamsForYear } from "@/lib/queries/match-play"
import { getCurrentSeason } from "@/lib/season"

import { TeamsClient } from "./teams-client"

export const dynamic = "force-dynamic"

export default async function MatchPlayTeamsPage() {
	const currentYear = getCurrentSeason()
	const teams = await getTeamsForYear(currentYear)

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			<H1 className="mb-4">{currentYear} Match Play Teams</H1>
			<TeamsClient teams={teams} year={currentYear} />
		</div>
	)
}
