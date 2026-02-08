import { ClubsTable, H1, Markdown } from "@mpga/ui"

import { getMembersContent, getClubsWithMembershipStatus } from "@/lib/queries/clubs"
import { getCurrentSeason } from "@/lib/season"

export const metadata = {
	title: "Member Clubs | MPGA",
	description: "View MPGA member clubs and their membership status.",
}

export default async function MembersPage() {
	const currentYear = getCurrentSeason()
	const [content, clubs] = await Promise.all([
		getMembersContent(),
		getClubsWithMembershipStatus(currentYear),
	])

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<H1 className="mb-8">Member Clubs</H1>

			{content && (
				<div className="mb-8">
					<Markdown content={content.content} />
				</div>
			)}

			<ClubsTable clubs={clubs} />
		</main>
	)
}
