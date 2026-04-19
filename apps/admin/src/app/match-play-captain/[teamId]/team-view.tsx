"use client"

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@mpga/ui"
import { Plus } from "lucide-react"
import { useState } from "react"

import type { CaptainResult, CaptainTeam, OpponentOption } from "../types"
import { ResultFormDialog } from "./result-form-dialog"

interface TeamViewProps {
	team: CaptainTeam
	initialResults: CaptainResult[]
	opponents: OpponentOption[]
}

export function TeamView({ team, initialResults, opponents }: TeamViewProps) {
	const [results, setResults] = useState(initialResults)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editing, setEditing] = useState<CaptainResult | null>(null)

	const handleOpenNew = () => {
		setEditing(null)
		setDialogOpen(true)
	}

	const handleOpenEdit = (result: CaptainResult) => {
		setEditing(result)
		setDialogOpen(true)
	}

	const handleSaved = (saved: CaptainResult) => {
		setResults((prev) => {
			const idx = prev.findIndex((r) => r.id === saved.id)
			if (idx >= 0) {
				const next = [...prev]
				next[idx] = saved
				return next.sort((a, b) => a.matchDate.localeCompare(b.matchDate))
			}
			return [...prev, saved].sort((a, b) => a.matchDate.localeCompare(b.matchDate))
		})
		setDialogOpen(false)
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle className="font-heading">Results</CardTitle>
					<Button variant="secondary" size="sm" onClick={handleOpenNew}>
						<Plus className="mr-1 h-4 w-4" />
						New Result
					</Button>
				</CardHeader>
				<CardContent>
					{results.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No results entered yet. Click &ldquo;New Result&rdquo; to enter your first match.
						</p>
					) : (
						<ul className="divide-y">
							{results.map((r) => {
								const weAreHome = r.homeTeamId === team.id
								const ourScore = weAreHome ? r.homeTeamScore : r.awayTeamScore
								const theirScore = weAreHome ? r.awayTeamScore : r.homeTeamScore
								const opponentName = weAreHome ? r.awayClubName : r.homeClubName
								return (
									<li key={r.id}>
										<button
											type="button"
											onClick={() => handleOpenEdit(r)}
											className="flex w-full items-center justify-between py-3 text-left hover:bg-accent/50"
										>
											<div>
												<p className="font-medium">
													vs. {opponentName}
													{weAreHome ? (
														<Badge variant="outline" className="ml-2 text-xs">
															Home
														</Badge>
													) : (
														<Badge variant="outline" className="ml-2 text-xs">
															Away
														</Badge>
													)}
													{r.forfeit && (
														<Badge variant="outline" className="ml-2 text-xs">
															Forfeit
														</Badge>
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													{new Date(r.matchDate + "T00:00:00").toLocaleDateString("en-US", {
														year: "numeric",
														month: "short",
														day: "numeric",
													})}
													{r.enteredBy && ` · entered by ${r.enteredBy}`}
												</p>
											</div>
											<div className="text-right">
												<p className="font-heading text-lg">
													{ourScore} &ndash; {theirScore}
												</p>
											</div>
										</button>
									</li>
								)
							})}
						</ul>
					)}
				</CardContent>
			</Card>

			<ResultFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				team={team}
				opponents={opponents}
				editing={editing}
				onSaved={handleSaved}
			/>
		</>
	)
}
