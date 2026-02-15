import { AwardSystemName } from "@mpga/types"
import {
	AwardWinnersList,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ContentCard,
	H2,
} from "@mpga/ui"

import { getAwardWithWinners, getPastPresidentsContent } from "@/lib/queries/about"

export const dynamic = "force-dynamic"

export default async function PastPresidentsPage() {
	const [content, award] = await Promise.all([
		getPastPresidentsContent(),
		getAwardWithWinners(AwardSystemName.PastPresidents),
	])

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			<div className="grid gap-8 lg:grid-cols-2">
				{content && <ContentCard heading="h1" title={content.title} content={content.content} />}
				{award && (
					<Card>
						<CardHeader>
							<CardTitle>
								<H2>Past Presidents</H2>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<AwardWinnersList winners={award.winners} />
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
