"use client"

import * as React from "react"

import { H3 } from "./ui/heading"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export interface MatchPlayResultRow {
	id: number
	groupName: string
	matchDate: string
	homeClubName: string
	homeTeamScore: string
	awayClubName: string
	awayTeamScore: string
	forfeit: boolean
	notes: string | null
}

export interface MatchPlayResultsTableProps {
	results: MatchPlayResultRow[]
}

function formatDate(dateStr: string): string {
	const [year, month, day] = dateStr.split("-").map(Number)
	const date = new Date(year!, month! - 1, day)
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function MatchPlayResultsTable({ results }: MatchPlayResultsTableProps) {
	const grouped = React.useMemo(() => {
		const map = new Map<string, MatchPlayResultRow[]>()
		for (const result of results) {
			const group = map.get(result.groupName)
			if (group) {
				group.push(result)
			} else {
				map.set(result.groupName, [result])
			}
		}
		return map
	}, [results])

	if (results.length === 0) {
		return (
			<div className="rounded-lg bg-white p-6 shadow-sm">
				<p className="text-sm text-gray-500">No results have been posted yet.</p>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{Array.from(grouped.entries()).map(([groupName, groupResults]) => (
				<div key={groupName}>
					<H3 className="mb-3 text-lg">{groupName}</H3>
					<div className="rounded-lg bg-white shadow-sm">
						<Table className="min-w-full divide-y divide-gray-200">
							<TableHeader className="bg-primary-50">
								<TableRow className="hover:bg-transparent">
									<TableHead
										scope="col"
										className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
									>
										Date
									</TableHead>
									<TableHead
										scope="col"
										className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
									>
										Home
									</TableHead>
									<TableHead
										scope="col"
										className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
									>
										Score
									</TableHead>
									<TableHead
										scope="col"
										className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
									>
										Away
									</TableHead>
									<TableHead
										scope="col"
										className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
									>
										Score
									</TableHead>
									<TableHead
										scope="col"
										className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
									>
										Forfeit
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="divide-y divide-gray-100 bg-white">
								{groupResults.map((result) => {
									const homeScore = parseFloat(result.homeTeamScore)
									const awayScore = parseFloat(result.awayTeamScore)
									const homeWins = homeScore > awayScore
									const awayWins = awayScore > homeScore

									return (
										<TableRow key={result.id} className="hover:bg-gray-50">
											<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
												{formatDate(result.matchDate)}
											</TableCell>
											<TableCell
												className={`whitespace-nowrap px-4 py-3 text-sm ${homeWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
											>
												{result.homeClubName}
											</TableCell>
											<TableCell
												className={`whitespace-nowrap px-4 py-3 text-center text-sm ${homeWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
											>
												{result.homeTeamScore}
											</TableCell>
											<TableCell
												className={`whitespace-nowrap px-4 py-3 text-sm ${awayWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
											>
												{result.awayClubName}
											</TableCell>
											<TableCell
												className={`whitespace-nowrap px-4 py-3 text-center text-sm ${awayWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
											>
												{result.awayTeamScore}
											</TableCell>
											<TableCell className="whitespace-nowrap px-4 py-3 text-center text-sm">
												{result.forfeit && (
													<span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
														Forfeit
													</span>
												)}
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</div>
				</div>
			))}
		</div>
	)
}
