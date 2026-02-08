import { H1, H2, Markdown, MatchPlaySignUp, MatchPlayGroupCards } from "@mpga/ui"

import { getMatchPlayContent } from "@/lib/queries/content"
import { getTeamsForYear } from "@/lib/queries/match-play"
import { getCurrentSeason } from "@/lib/season"

export default async function MatchPlayPage() {
	const currentYear = getCurrentSeason()
	const deadlineStr = process.env.MATCH_PLAY_DEADLINE

	let showSignUp = false
	let formattedDeadline = ""

	if (deadlineStr) {
		const deadline = new Date(`${deadlineStr}T23:59:59`)
		if (!isNaN(deadline.getTime()) && new Date() <= deadline) {
			showSignUp = false
			formattedDeadline = deadline.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		}
	}

	const [content, teams] = await Promise.all([
		getMatchPlayContent(),
		showSignUp ? Promise.resolve([]) : getTeamsForYear(currentYear),
	])

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<H1 className="mb-8">{content?.title}</H1>
			{content && <Markdown content={content.content} className="mb-8" />}
			{showSignUp ? (
				<MatchPlaySignUp year={currentYear} deadline={formattedDeadline} />
			) : (
				<>
					<H2 className="mb-4 font-semibold text-primary-800">{currentYear} Match Play Groups</H2>
					<MatchPlayGroupCards teams={teams} year={currentYear} />
				</>
			)}
		</main>
	)
}
