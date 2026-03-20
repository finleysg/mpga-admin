import { H1 } from "@mpga/ui"

import { getTeamsForYear } from "@/lib/queries/match-play"
import { getCurrentSeason } from "@/lib/season"

import { TeamsClient } from "./teams-client"

export const dynamic = "force-dynamic"

function isTeamsVisible(): boolean {
	const publishStr = process.env.MATCH_PLAY_PUBLISH
	if (!publishStr) return false

	const publish = new Date(`${publishStr}T00:00:00`)
	if (isNaN(publish.getTime())) return false

	const now = new Date()
	const endOfYear = new Date(publish.getFullYear() + 1, 0, 1)

	return now >= publish && now < endOfYear
}

export default async function MatchPlayTeamsPage() {
	const currentYear = getCurrentSeason()

	if (!isTeamsVisible()) {
		return (
			<div className="mx-auto max-w-6xl px-4 py-8">
				<H1 className="mb-4">{currentYear} Match Play Teams</H1>
				<p className="text-muted-foreground">Teams will be announced soon.</p>
			</div>
		)
	}

	const teams = await getTeamsForYear(currentYear)

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			<H1 className="mb-4">{currentYear} Match Play Teams</H1>
			<TeamsClient teams={teams} year={currentYear} />
		</div>
	)
}
