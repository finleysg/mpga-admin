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

import { getAwardWithWinners } from "@/lib/queries/about"

export const dynamic = "force-dynamic"

export default async function RonSelfPage() {
	const award = await getAwardWithWinners(AwardSystemName.RonSelf)

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{award && (
				<div className="grid gap-8 lg:grid-cols-2">
					<ContentCard heading="h1" title={award.name} content={award.description} />
					<Card>
						<CardHeader>
							<CardTitle>
								<H2>Winners</H2>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<AwardWinnersList winners={award.winners} />
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
