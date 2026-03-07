"use client"

import { MatchPlayGroupCards, type MatchPlayTeamRow } from "@mpga/ui"

import { requestCaptainContacts } from "./actions"

export function TeamsClient({ teams, year }: { teams: MatchPlayTeamRow[]; year: number }) {
	return (
		<MatchPlayGroupCards
			teams={teams}
			year={year}
			onRequestCaptains={async (groupName, email) => {
				return requestCaptainContacts({ groupName, email, year })
			}}
		/>
	)
}
