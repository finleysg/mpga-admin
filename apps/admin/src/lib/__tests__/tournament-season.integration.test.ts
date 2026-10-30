// @vitest-environment node
import {
	content,
	getDisplayedTournamentSeason,
	golfCourse,
	tournament,
	tournamentInstance,
	tournamentLink,
	TOURNAMENT_SEASON_KEY,
} from "@mpga/database"
import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("../db", async () => {
	const { createDb } = await import("@mpga/database")
	return {
		db: createDb({
			host: "127.0.0.1",
			port: Number(process.env.TEST_DATABASE_PORT ?? 25062),
			user: "root",
			password: "mpga-test-only",
			database: "mpga_security_test",
		}),
	}
})
import { db } from "../db"
import { copyTournamentSeason, setDisplayedSeason } from "../tournament-season"

// Only the explicitly provisioned disposable test schema is used.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("tournament season transactions", () => {
	let courseId: number, tournamentId: number, sourceId: number
	beforeAll(async () => {
		courseId = (
			await db.insert(golfCourse).values({
				name: "Season test course",
				addressText: "",
				city: "Test",
				state: "MN",
				zip: "",
				websiteUrl: "",
				email: "",
				phone: "",
				logo: "",
			})
		)[0].insertId
		tournamentId = (
			await db
				.insert(tournament)
				.values({ name: "Season test", description: "Shared overview", systemName: "season-test" })
		)[0].insertId
		sourceId = (
			await db.insert(tournamentInstance).values({
				instanceType: "T",
				name: "Season test",
				description: "Annual description",
				notes: "Notes",
				startDate: "2090-08-01",
				rounds: 2,
				registrationStart: "2090-05-01 09:00:00",
				locationId: courseId,
				tournamentId,
			})
		)[0].insertId
		await db.insert(tournamentLink).values({
			title: "Old registration",
			url: "https://example.com",
			linkType: "registration",
			tournamentInstanceId: sourceId,
		})
	})
	afterAll(async () => {
		const instances = await db
			.select({ id: tournamentInstance.id })
			.from(tournamentInstance)
			.where(eq(tournamentInstance.tournamentId, tournamentId))
		if (instances.length)
			await db.delete(tournamentLink).where(
				inArray(
					tournamentLink.tournamentInstanceId,
					instances.map((row) => row.id),
				),
			)
		await db.delete(tournamentInstance).where(eq(tournamentInstance.tournamentId, tournamentId))
		await db.delete(tournament).where(eq(tournament.id, tournamentId))
		await db.delete(golfCourse).where(eq(golfCourse.id, courseId))
		await db.delete(content).where(eq(content.systemName, TOURNAMENT_SEASON_KEY))
	})
	it("rejects an early copy without creating records", async () => {
		await expect(copyTournamentSeason("2090-08-02")).rejects.toMatchObject({
			message: expect.stringContaining("cannot be copied"),
		})
	})
	it("serializes concurrent copies, preserves source, and excludes related links", async () => {
		const results = await Promise.allSettled([
			copyTournamentSeason("2090-08-03"),
			copyTournamentSeason("2090-08-03"),
		])
		expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1)
		const rows = await db
			.select()
			.from(tournamentInstance)
			.where(eq(tournamentInstance.tournamentId, tournamentId))
		expect(rows).toHaveLength(2)
		const copied = rows.find((row) => row.id !== sourceId)!
		expect(copied).toMatchObject({
			description: "Annual description",
			notes: "Notes",
			startDate: "2091-08-01",
			rounds: 2,
			locationId: courseId,
			tournamentId,
		})
		expect(rows.find((row) => row.id === sourceId)?.startDate).toBe("2090-08-01")
		expect(
			await db
				.select()
				.from(tournamentLink)
				.where(eq(tournamentLink.tournamentInstanceId, copied.id)),
		).toHaveLength(0)
		expect(await getDisplayedTournamentSeason(db, 2090)).toBe(2090)
		await expect(copyTournamentSeason("2090-08-03")).rejects.toMatchObject({
			message: expect.stringContaining("cannot be copied"),
		})
	})
	it("publishes explicitly, can switch back, and rejects empty seasons", async () => {
		await setDisplayedSeason(2091)
		expect(await getDisplayedTournamentSeason(db, 2090)).toBe(2091)
		await setDisplayedSeason(2090)
		expect(await getDisplayedTournamentSeason(db, 2091)).toBe(2090)
		await expect(setDisplayedSeason(2092)).rejects.toMatchObject({
			message: "No tournaments in that season",
		})
		expect(await getDisplayedTournamentSeason(db, 2091)).toBe(2090)
	})
})
