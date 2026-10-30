// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	copy: vi.fn(),
	publish: vi.fn(),
	revalidate: vi.fn(),
}))
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.auth }))
vi.mock("@/lib/tournament-season", () => ({
	copyTournamentSeason: mocks.copy,
	setDisplayedSeason: mocks.publish,
}))
vi.mock("@/lib/revalidate", () => ({ revalidatePublicSite: mocks.revalidate }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
import {
	copySeasonAction,
	setPublicTournamentSeasonAction,
} from "../../app/(dashboard)/season-actions"

beforeEach(() => vi.resetAllMocks())
it("rejects unauthenticated copy and publication without touching the database", async () => {
	mocks.auth.mockResolvedValue(null)
	expect(await copySeasonAction()).toEqual({ success: false, error: "Unauthorized" })
	expect(await setPublicTournamentSeasonAction(2027)).toEqual({
		success: false,
		error: "Unauthorized",
	})
	expect(mocks.copy).not.toHaveBeenCalled()
	expect(mocks.publish).not.toHaveBeenCalled()
})
it("validates public season input before writing", async () => {
	mocks.auth.mockResolvedValue("admin")
	for (const year of [NaN, 2027.5, 0, 10000])
		expect((await setPublicTournamentSeasonAction(year)).success).toBe(false)
	expect(mocks.publish).not.toHaveBeenCalled()
})
it("copying does not publish the new season", async () => {
	mocks.auth.mockResolvedValue("admin")
	mocks.copy.mockResolvedValue({ year: 2027, count: 5 })
	expect(await copySeasonAction()).toEqual({ success: true, data: { year: 2027, count: 5 } })
	expect(mocks.publish).not.toHaveBeenCalled()
})
