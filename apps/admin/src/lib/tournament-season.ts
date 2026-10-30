import {
	getDisplayedTournamentSeason,
	content,
	TOURNAMENT_SEASON_KEY,
	tournament,
	tournamentInstance,
} from "@mpga/database"
import { asc, eq, like } from "drizzle-orm"

import { db } from "./db"

export function seasonToday(now = new Date()): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Chicago",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now)
}

export async function selectedTournamentYear(value?: string): Promise<number> {
	if (value && /^\d{4}$/.test(value)) return Number(value)
	return getDisplayedTournamentSeason(
		db,
		Number(process.env.SEASON_YEAR) || Number(seasonToday().slice(0, 4)),
	)
}

export function nextYearDate(value: string): string {
	const year = Number(value.slice(0, 4)) + 1
	const month = Number(value.slice(5, 7))
	const day = Math.min(Number(value.slice(8, 10)), new Date(Date.UTC(year, month, 0)).getUTCDate())
	return `${year}-${value.slice(5, 7)}-${String(day).padStart(2, "0")}${value.slice(10)}`
}

type Instance = typeof tournamentInstance.$inferSelect

export function canCopySeason(
	rows: Pick<Instance, "startDate" | "rounds">[],
	today: string,
): boolean {
	const year = Number(today.slice(0, 4))
	const current = rows.filter((row) => row.startDate.startsWith(`${year}-`))
	return (
		current.length > 0 &&
		!rows.some((row) => row.startDate.startsWith(`${year + 1}-`)) &&
		current.every((row) => {
			const end = new Date(`${row.startDate}T00:00:00Z`)
			end.setUTCDate(end.getUTCDate() + Math.max(1, row.rounds) - 1)
			return end.toISOString().slice(0, 10) < today
		})
	)
}

export function copySeasonValues(row: Instance): typeof tournamentInstance.$inferInsert {
	return {
		instanceType: row.instanceType,
		name: row.name,
		description: row.description,
		notes: row.notes,
		startDate: nextYearDate(row.startDate),
		rounds: row.rounds,
		registrationStart: row.registrationStart ? nextYearDate(row.registrationStart) : null,
		registrationEnd: row.registrationEnd ? nextYearDate(row.registrationEnd) : null,
		locationId: row.locationId,
		tournamentId: row.tournamentId,
	}
}

export async function copyTournamentSeason(today = seasonToday()) {
	return db.transaction(async (tx) => {
		// Serialize season copies across requests and app replicas using stable parent rows.
		await tx
			.select({ id: tournament.id })
			.from(tournament)
			.orderBy(asc(tournament.id))
			.for("update")
		const rows = await tx.select().from(tournamentInstance).for("update")
		if (!canCopySeason(rows, today))
			throw new Error(
				"The season cannot be copied until all tournaments have ended and the following season is empty.",
			)
		const year = Number(today.slice(0, 4))
		const source = rows.filter((row) => row.startDate.startsWith(`${year}-`))
		await tx.insert(tournamentInstance).values(source.map(copySeasonValues))
		return { year: year + 1, count: source.length }
	})
}

export async function setDisplayedSeason(year: number) {
	await db.transaction(async (tx) => {
		await tx
			.select({ id: tournament.id })
			.from(tournament)
			.orderBy(asc(tournament.id))
			.for("update")
		const instances = await tx
			.select({ id: tournamentInstance.id })
			.from(tournamentInstance)
			.where(like(tournamentInstance.startDate, `${year}-%`))
			.limit(1)
			.for("update")
		if (!instances.length) throw new Error("No tournaments in that season")
		const [existing] = await tx
			.select({ id: content.id })
			.from(content)
			.where(eq(content.systemName, TOURNAMENT_SEASON_KEY))
			.for("update")
		if (existing)
			await tx
				.update(content)
				.set({ contentText: String(year) })
				.where(eq(content.id, existing.id))
		else
			await tx.insert(content).values({
				systemName: TOURNAMENT_SEASON_KEY,
				title: "Public tournament season",
				contentText: String(year),
			})
	})
}
