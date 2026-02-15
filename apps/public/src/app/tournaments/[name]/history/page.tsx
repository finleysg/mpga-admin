import { getMediaUrl } from "@mpga/types"
import { DocumentsCard, H1, HistoryResultsTable, Markdown, PhotoCarousel } from "@mpga/ui"
import { notFound } from "next/navigation"

import {
	getTournamentBySystemName,
	getTournamentHistory,
	getTournamentPhotos,
	getTournamentHistoryDocuments,
} from "@/lib/queries/tournaments"

export const revalidate = 86400 // 24 hours — safety net; admin triggers on-demand revalidation
export const dynamicParams = true

export async function generateStaticParams() {
	return []
}

type Params = Promise<{ name: string }>

export default async function TournamentHistoryPage({ params }: { params: Params }) {
	const { name } = await params

	const tournament = await getTournamentBySystemName(name)

	if (!tournament) {
		notFound()
	}

	const [history, photos, documents] = await Promise.all([
		getTournamentHistory(tournament.id),
		getTournamentPhotos(tournament.id),
		getTournamentHistoryDocuments(tournament.id),
	])

	const historyResults = history.map((h) => ({
		id: h.id,
		year: h.year,
		location: h.location,
		winner: h.winner,
		winnerClub: h.winnerClub,
		coWinner: h.coWinner,
		coWinnerClub: h.coWinnerClub,
		division: h.division,
		score: h.score,
		isMatch: h.isMatch,
		isNet: h.isNet,
	}))

	const photoItems = photos.map((p) => ({
		id: p.id,
		imageUrl: getMediaUrl(p.rawImage) ?? "",
		caption: p.caption,
		year: p.year,
	}))

	const documentItems = documents
		.filter((doc) => doc.file && doc.documentType === "Results")
		.map((doc) => ({
			id: doc.id,
			title: doc.title,
			fileUrl: getMediaUrl(doc.file) ?? "",
		}))

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<H1 className="mb-6">{tournament.name} History</H1>

			<Markdown content={tournament.description} className="mb-8" />

			<div className="flex flex-col gap-8 lg:flex-row">
				<div className="lg:w-[70%]">
					<HistoryResultsTable results={historyResults} />
				</div>

				<div className="flex flex-col gap-6 lg:w-[30%]">
					<PhotoCarousel photos={photoItems} />
					<DocumentsCard documents={documentItems} title="Result Documents" />
				</div>
			</div>
		</main>
	)
}
