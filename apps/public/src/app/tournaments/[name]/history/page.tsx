import { H1, HistoryResultsTable, Markdown } from "@mpga/ui"
import { notFound } from "next/navigation"

import { getTournamentBySystemName, getTournamentHistory } from "@/lib/queries/tournaments"

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

	const [history] = await Promise.all([getTournamentHistory(tournament.id)])

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

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<H1 className="mb-6">{tournament.name} History</H1>
			<Markdown content={tournament.description} className="mb-8" />
			<HistoryResultsTable results={historyResults} />
		</main>
	)
}
