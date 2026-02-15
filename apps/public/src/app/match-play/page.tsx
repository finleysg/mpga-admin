import { ContentCard, MatchPlaySignUp } from "@mpga/ui"

import { getMatchPlayContent } from "@/lib/queries/content"
import { getCurrentSeason } from "@/lib/season"

export const dynamic = "force-dynamic"

export default async function MatchPlayPage() {
	const currentYear = getCurrentSeason()
	const deadlineStr = process.env.MATCH_PLAY_DEADLINE

	let showSignUp = false
	let formattedDeadline = ""

	if (deadlineStr) {
		const deadline = new Date(`${deadlineStr}T23:59:59`)
		if (!isNaN(deadline.getTime()) && new Date() <= deadline) {
			showSignUp = true
			formattedDeadline = deadline.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		}
	}

	const content = await getMatchPlayContent()

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{showSignUp && (
				<div className="mb-8">
					<MatchPlaySignUp year={currentYear} deadline={formattedDeadline} />
				</div>
			)}
			{content && (
				<ContentCard
					heading="h1"
					title={content.title}
					content={content.content}
					className="mb-8"
				/>
			)}
		</div>
	)
}
