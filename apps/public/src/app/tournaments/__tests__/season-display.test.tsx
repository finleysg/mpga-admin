// @vitest-environment node
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ readSetting: vi.fn(), tournaments: vi.fn() }))
vi.mock("@/lib/db", () => ({
	db: { select: () => ({ from: () => ({ where: () => ({ limit: mocks.readSetting }) }) }) },
}))
vi.mock("@/lib/season", () => ({ getCurrentSeason: () => 2026 }))
vi.mock("@/lib/queries/tournaments", () => ({
	getTournamentsForYear: mocks.tournaments,
	formatTournamentDates: (date: string) => date,
}))
vi.mock("@mpga/ui", () => ({
	H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
	TournamentPoliciesBanner: () => null,
	TournamentCard: ({ name, href }: { name: string; href: string }) => <a href={href}>{name}</a>,
}))

import TournamentsPage from "../page"

beforeEach(() => {
	vi.resetAllMocks()
	mocks.tournaments.mockImplementation(async (year: number) => [
		{
			instanceId: year,
			systemName: "state-amateur",
			tournamentName: "State Amateur",
			tournamentDescription: "Championship",
			startDate: `${year}-06-01`,
			rounds: 2,
			venueName: "Test course",
			venueCity: "Test city",
			venueLogo: "",
		},
	])
})

it("reads the changed public year on the next load and updates heading and links", async () => {
	// Exercise the real shared setting reader against successive database responses.
	mocks.readSetting
		.mockResolvedValueOnce([{ value: "2026" }])
		.mockResolvedValueOnce([{ value: "2027" }])
	const before = renderToStaticMarkup(await TournamentsPage())
	expect(before).toContain("2026 Tournament Schedule")
	expect(before).toContain('href="/tournaments/state-amateur/2026"')
	const after = renderToStaticMarkup(await TournamentsPage())
	expect(after).toContain("2027 Tournament Schedule")
	expect(after).toContain('href="/tournaments/state-amateur/2027"')
	expect(after).not.toContain("/tournaments/state-amateur/2026")
	expect(mocks.tournaments.mock.calls).toEqual([[2026], [2027]])
	expect(mocks.readSetting).toHaveBeenCalledTimes(2)
})

it("uses the existing season until an admin sets the public year", async () => {
	mocks.readSetting.mockResolvedValueOnce([]).mockResolvedValueOnce([{ value: "2027" }])
	expect(renderToStaticMarkup(await TournamentsPage())).toContain("2026 Tournament Schedule")
	expect(renderToStaticMarkup(await TournamentsPage())).toContain("2027 Tournament Schedule")
})
