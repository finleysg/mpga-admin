export interface CaptainTeam {
	id: number
	year: number
	groupName: string
	isSenior: boolean
	clubId: number
	clubName: string
}

export interface CaptainResult {
	id: number
	groupName: string
	matchDate: string
	homeTeamId: number
	homeClubName: string
	homeTeamScore: string
	awayTeamId: number
	awayClubName: string
	awayTeamScore: string
	forfeit: boolean
	enteredBy: string
	notes: string | null
}

export interface OpponentOption {
	id: number
	clubName: string
}

export interface CaptainResultInput {
	id?: number
	captainTeamId: number
	opponentTeamId: number
	weAreHome: boolean
	matchDate: string
	ourScore: string
	opponentScore: string
	forfeit: boolean
	notes: string | null
}
