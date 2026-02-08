import { ClubsTable, ContentCard } from "@mpga/ui"

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
			{content && (
				<ContentCard
					heading="h1"
					title={content.title}
					content={content.content}
					className="mb-8"
				/>
			)}

			<ClubsTable clubs={clubs} />
		</main>
	)
}
