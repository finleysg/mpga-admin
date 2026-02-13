export interface ClubContactClubData {
	id: number
	name: string
	website: string
	golfCourseId: number | null
	golfCourseName: string | null
	size: number | null
	notes: string | null
}

export interface ClubContactClubInput {
	id: number
	name: string
	website: string
	golfCourseId: number | null
	size: number | null
	notes: string | null
}

export interface GolfCourseOption {
	id: number
	name: string
}

export interface ClubContactData {
	clubContactId: number
	contactId: number
	firstName: string
	lastName: string
	email: string | null
	primaryPhone: string | null
	isPrimary: boolean
	roles: { id: number; role: string }[]
}

export interface ContactSearchResult {
	id: number
	firstName: string
	lastName: string
	email: string | null
}

export interface ClubDuesStatus {
	clubName: string
	year: number
	isPaid: boolean
	paymentDate: string | null
}
