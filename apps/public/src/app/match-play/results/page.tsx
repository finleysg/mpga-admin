import { getMediaUrl } from "@mpga/types"
import { DocumentsCard, H1, MatchPlayResultsTable } from "@mpga/ui"

import { getMatchPlayDocuments, getMatchPlayResults } from "@/lib/queries/match-play"
import { getCurrentSeason } from "@/lib/season"

export const dynamic = "force-dynamic"

export default async function MatchPlayResultsPage() {
	const year = getCurrentSeason()
	const [documents, results] = await Promise.all([
		getMatchPlayDocuments(year),
		getMatchPlayResults(year),
	])

	const documentItems = documents.map((doc) => ({
		id: doc.id,
		title: doc.title,
		fileUrl: getMediaUrl(doc.file) ?? "",
	}))

	return (
		<div className="mx-auto max-w-7xl px-4 py-8">
			<H1 className="mb-8">Schedule and Results</H1>

			<div className="lg:grid lg:grid-cols-[1fr_auto] lg:gap-8">
				{documentItems.length > 0 && (
					<div className="mb-8 lg:order-last lg:mb-0 lg:w-72">
						<DocumentsCard documents={documentItems} title="Downloads" />
					</div>
				)}

				<section className="lg:order-first">
					<MatchPlayResultsTable results={results} />
				</section>
			</div>
		</div>
	)
}
