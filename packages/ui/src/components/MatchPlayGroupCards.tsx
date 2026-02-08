"use client"

import { Button } from "./ui/button"
import { H3 } from "./ui/heading"

export interface MatchPlayTeamRow {
	id: number
	clubName: string
	groupName: string
	isSenior: boolean
}

export interface MatchPlayGroupCardsProps {
	teams: MatchPlayTeamRow[]
	year: number
}

export function MatchPlayGroupCards({ teams, year }: MatchPlayGroupCardsProps) {
	if (teams.length === 0) {
		return <p className="text-gray-600">No teams have been assigned for {year} yet.</p>
	}

	const groups = new Map<string, MatchPlayTeamRow[]>()
	for (const team of teams) {
		const existing = groups.get(team.groupName) ?? []
		existing.push(team)
		groups.set(team.groupName, existing)
	}

	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from(groups.entries()).map(([groupName, groupTeams]) => {
				const isSenior = groupTeams[0]?.isSenior
				return (
					<div key={groupName} className="rounded-lg bg-white p-6 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<H3 className="text-lg font-bold text-primary-900">{groupName}</H3>
							{isSenior && (
								<span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
									Senior
								</span>
							)}
						</div>
						<ul className="mb-4 space-y-1.5">
							{groupTeams.map((team) => (
								<li
									key={team.id}
									className="text-sm text-gray-700 before:mr-2 before:text-primary-300 before:content-['•']"
								>
									{team.clubName}
								</li>
							))}
						</ul>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								console.log(`Get captains for ${groupName}`)
							}}
						>
							Captains
						</Button>
					</div>
				)
			})}
		</div>
	)
}
