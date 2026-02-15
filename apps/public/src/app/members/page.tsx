import { getMediaUrl } from "@mpga/types"
import { ClubsTable, ContentCard, DownloadLink } from "@mpga/ui"

import {
	getMembersContent,
	getClubsWithMembershipStatus,
	getClubRegistrationDocument,
} from "@/lib/queries/clubs"
import { getCurrentSeason } from "@/lib/season"

export const dynamic = "force-dynamic"

export const metadata = {
	title: "Member Clubs | MPGA",
	description: "View MPGA member clubs and their membership status.",
}

export default async function MembersPage() {
	const currentYear = getCurrentSeason()
	const [content, clubs, registrationDoc] = await Promise.all([
		getMembersContent(),
		getClubsWithMembershipStatus(currentYear),
		getClubRegistrationDocument(currentYear),
	])

	const registrationFooter = registrationDoc ? (
		<DownloadLink href={getMediaUrl(registrationDoc.file) ?? ""} title={registrationDoc.title} />
	) : null

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			{content && (
				<ContentCard
					heading="h1"
					title={content.title}
					content={content.content}
					className="mb-8"
					footer={registrationFooter}
				/>
			)}

			<ClubsTable clubs={clubs} />
		</main>
	)
}
