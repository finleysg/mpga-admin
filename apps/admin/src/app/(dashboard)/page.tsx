import { getDisplayedTournamentSeason, tournament, tournamentInstance } from "@mpga/database"
import { Card, CardContent, CardHeader, CardTitle, H1, H2 } from "@mpga/ui"
import { asc, eq } from "drizzle-orm"
import Link from "next/link"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { canCopySeason, seasonToday } from "@/lib/tournament-season"

import { CopySeasonButton } from "./copy-season-button"
import { PublicSeasonForm } from "./public-season-form"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
	if (!(await requireAuth())) return null
	const today = seasonToday()
	const year = Number(today.slice(0, 4))
	const rows = await db
		.select({
			startDate: tournamentInstance.startDate,
			rounds: tournamentInstance.rounds,
			id: tournamentInstance.id,
			name: tournamentInstance.name,
			systemName: tournament.systemName,
		})
		.from(tournamentInstance)
		.leftJoin(tournament, eq(tournamentInstance.tournamentId, tournament.id))
		.orderBy(asc(tournamentInstance.startDate))
	const displayedYear = await getDisplayedTournamentSeason(
		db,
		Number(process.env.SEASON_YEAR) || year,
	)
	const years = [...new Set(rows.map((row) => Number(row.startDate.slice(0, 4))))].sort(
		(a, b) => b - a,
	)
	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<H1 variant="secondary">Admin Dashboard</H1>
			</div>

			<Card>
				<CardHeader className="border-b border-gray-200">
					<CardTitle>
						<H2 variant="secondary">MPGA Administration</H2>
					</CardTitle>
				</CardHeader>
				<CardContent className="py-8 text-center text-gray-500">
					<div className="space-y-6 text-left">
						<PublicSeasonForm key={displayedYear} year={displayedYear} years={years} />
						{canCopySeason(rows, today) && (
							<div className="space-y-2">
								<CopySeasonButton year={year} />
								<p>
									Copy tournament details and descriptions, with dates advanced one year. Documents,
									links, photos, and results are not copied.
								</p>
							</div>
						)}
						{[year, year + 1].map((season) => (
							<section key={season}>
								<H2 variant="secondary">{season} Tournaments</H2>
								<ul className="mt-3 space-y-2">
									{rows
										.filter((row) => row.startDate.startsWith(`${season}-`) && row.systemName)
										.map((row) => (
											<li key={row.id}>
												<Link
													className="underline"
													href={`/tournaments/${row.systemName}?year=${season}`}
												>
													{row.name}
												</Link>
											</li>
										))}
								</ul>
							</section>
						))}
					</div>
				</CardContent>
			</Card>
		</main>
	)
}
