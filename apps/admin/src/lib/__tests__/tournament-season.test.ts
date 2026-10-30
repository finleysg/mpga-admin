// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

vi.mock("../db", () => ({ db: {} }))
import { canCopySeason, copySeasonValues, nextYearDate, seasonToday } from "../tournament-season"

describe("season rollover eligibility", () => {
	it("requires a source season and an entirely empty following season", () => {
		expect(canCopySeason([], "2026-10-29")).toBe(false)
		expect(canCopySeason([{ startDate: "2025-06-01", rounds: 1 }], "2026-10-29")).toBe(false)
		expect(
			canCopySeason(
				[
					{ startDate: "2026-06-01", rounds: 1 },
					{ startDate: "2027-06-01", rounds: 1 },
				],
				"2026-10-29",
			),
		).toBe(false)
	})
	it("waits until after every tournament's final round, including December rollover", () => {
		const rows = [{ startDate: "2026-10-27", rounds: 3 }]
		expect(canCopySeason(rows, "2026-10-29")).toBe(false)
		expect(canCopySeason(rows, "2026-10-30")).toBe(true)
		expect(canCopySeason([...rows, { startDate: "2026-12-31", rounds: 2 }], "2026-12-31")).toBe(
			false,
		)
	})
	it("uses the Central calendar date even after UTC midnight", () => {
		expect(seasonToday(new Date("2026-10-30T02:00:00Z"))).toBe("2026-10-29")
	})
	it("advances dates while preserving times and clamps leap day", () => {
		expect(nextYearDate("2028-02-29 09:30:00.000000")).toBe("2029-02-28 09:30:00.000000")
		expect(nextYearDate("2026-12-31")).toBe("2027-12-31")
	})
	it("copies only instance details, with fresh identity and next-year dates", () => {
		const source = {
			id: 13,
			instanceType: "T",
			name: "Championship",
			description: "**Details**",
			notes: "Notes",
			startDate: "2026-06-01",
			rounds: 2,
			registrationStart: "2026-04-01 08:00:00.000000",
			registrationEnd: null,
			locationId: 5,
			tournamentId: 3,
		}
		expect(copySeasonValues(source)).toEqual({
			instanceType: "T",
			name: "Championship",
			description: "**Details**",
			notes: "Notes",
			startDate: "2027-06-01",
			rounds: 2,
			registrationStart: "2027-04-01 08:00:00.000000",
			registrationEnd: null,
			locationId: 5,
			tournamentId: 3,
		})
	})
})
