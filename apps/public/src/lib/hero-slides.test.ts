import { describe, it, expect } from "vitest"

import { buildHeroSlides } from "./hero-slides"
import type { TournamentForYear } from "./queries/tournaments"

function makeTournament(overrides: Partial<TournamentForYear> = {}): TournamentForYear {
	return {
		tournamentId: 1,
		tournamentName: "Test Tournament",
		tournamentDescription: "",
		systemName: "test",
		instanceId: 1,
		instanceName: "Test Tournament",
		startDate: "2026-06-15",
		rounds: 2,
		venueName: "Test Course",
		venueCity: "Minneapolis",
		venueState: "MN",
		venueLogo: "",
		...overrides,
	}
}

const LOGO_SLIDE = { type: "logo", imageUrl: "/images/mpga-logo.png" }

describe("buildHeroSlides", () => {
	it("returns only the logo slide when there are no tournaments", () => {
		const slides = buildHeroSlides([], 2026, "2026-06-01")

		expect(slides).toHaveLength(1)
		expect(slides[0]).toEqual(LOGO_SLIDE)
	})

	it("puts the next upcoming tournament first", () => {
		const tournaments = [
			makeTournament({ tournamentId: 1, systemName: "four-ball", startDate: "2026-05-01" }),
			makeTournament({ tournamentId: 2, systemName: "mid-am", startDate: "2026-07-10" }),
			makeTournament({ tournamentId: 3, systemName: "publinks", startDate: "2026-08-20" }),
		]

		const slides = buildHeroSlides(tournaments, 2026, "2026-06-01")

		expect(slides[0]!.type).toBe("tournament")
		expect(slides[0]!.imageUrl).toBe("/images/mid-am.jpg")
	})

	it("places past tournaments after the logo slide", () => {
		const tournaments = [
			makeTournament({ tournamentId: 1, systemName: "four-ball", startDate: "2026-05-01" }),
			makeTournament({ tournamentId: 2, systemName: "mid-am", startDate: "2026-07-10" }),
		]

		const slides = buildHeroSlides(tournaments, 2026, "2026-06-01")

		// Order: mid-am (upcoming), logo, four-ball (past)
		expect(slides).toHaveLength(3)
		expect(slides[0]!.imageUrl).toBe("/images/mid-am.jpg")
		expect(slides[1]).toEqual(LOGO_SLIDE)
		expect(slides[2]!.imageUrl).toBe("/images/four-ball.jpg")
	})

	it("shows logo first when all tournaments are in the past", () => {
		const tournaments = [
			makeTournament({ tournamentId: 1, systemName: "four-ball", startDate: "2026-05-01" }),
			makeTournament({ tournamentId: 2, systemName: "mid-am", startDate: "2026-06-10" }),
		]

		const slides = buildHeroSlides(tournaments, 2026, "2026-09-01")

		expect(slides[0]).toEqual(LOGO_SLIDE)
		expect(slides[1]!.imageUrl).toBe("/images/four-ball.jpg")
		expect(slides[2]!.imageUrl).toBe("/images/mid-am.jpg")
	})

	it("shows first tournament when all are upcoming", () => {
		const tournaments = [
			makeTournament({ tournamentId: 1, systemName: "four-ball", startDate: "2026-05-01" }),
			makeTournament({ tournamentId: 2, systemName: "mid-am", startDate: "2026-07-10" }),
		]

		const slides = buildHeroSlides(tournaments, 2026, "2026-01-01")

		// All upcoming: four-ball first, then mid-am, then logo, no past
		expect(slides[0]!.imageUrl).toBe("/images/four-ball.jpg")
		expect(slides[1]!.imageUrl).toBe("/images/mid-am.jpg")
		expect(slides[2]).toEqual(LOGO_SLIDE)
	})

	it("excludes tournaments without a systemName", () => {
		const tournaments = [
			makeTournament({ tournamentId: 1, systemName: null, startDate: "2026-07-10" }),
			makeTournament({ tournamentId: 2, systemName: "mid-am", startDate: "2026-08-20" }),
		]

		const slides = buildHeroSlides(tournaments, 2026, "2026-06-01")

		// Only mid-am + logo
		expect(slides).toHaveLength(2)
		expect(slides[0]!.imageUrl).toBe("/images/mid-am.jpg")
		expect(slides[1]).toEqual(LOGO_SLIDE)
	})

	it("includes subtitle only when instance name differs from tournament name", () => {
		const tournaments = [
			makeTournament({
				systemName: "mid-am",
				tournamentName: "Mid-Amateur",
				instanceName: "2026 Mid-Amateur Championship",
				startDate: "2026-07-10",
			}),
		]

		const slides = buildHeroSlides(tournaments, 2026, "2026-06-01")

		expect(slides[0]!.subtitle).toBe("2026 Mid-Amateur Championship")
	})

	it("omits subtitle when instance name matches tournament name", () => {
		const tournaments = [
			makeTournament({
				systemName: "mid-am",
				tournamentName: "Mid-Amateur",
				instanceName: "Mid-Amateur",
				startDate: "2026-07-10",
			}),
		]

		const slides = buildHeroSlides(tournaments, 2026, "2026-06-01")

		expect(slides[0]!.subtitle).toBeUndefined()
	})

	it("builds correct ctaUrl with the given year", () => {
		const tournaments = [makeTournament({ systemName: "publinks", startDate: "2026-08-20" })]

		const slides = buildHeroSlides(tournaments, 2026, "2026-06-01")

		expect(slides[0]!.ctaUrl).toBe("/tournaments/publinks/2026")
	})

	it("treats a tournament starting today as upcoming", () => {
		const tournaments = [makeTournament({ systemName: "mid-am", startDate: "2026-06-15" })]

		const slides = buildHeroSlides(tournaments, 2026, "2026-06-15")

		expect(slides[0]!.type).toBe("tournament")
		expect(slides[0]!.imageUrl).toBe("/images/mid-am.jpg")
	})
})
