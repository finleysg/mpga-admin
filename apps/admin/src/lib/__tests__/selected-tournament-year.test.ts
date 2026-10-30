// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const readSetting = vi.hoisted(() => vi.fn())
vi.mock("../db", () => ({
	db: { select: () => ({ from: () => ({ where: () => ({ limit: readSetting }) }) }) },
}))
import { selectedTournamentYear } from "../tournament-season"

beforeEach(() => {
	vi.resetAllMocks()
	vi.useFakeTimers()
	vi.setSystemTime(new Date("2026-10-29T12:00:00Z"))
	vi.stubEnv("SEASON_YEAR", "")
})
afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllEnvs()
})
it("defaults to the published season, not the calendar year, and picks up changes", async () => {
	readSetting.mockResolvedValueOnce([{ value: "2027" }]).mockResolvedValueOnce([{ value: "2028" }])
	expect(await selectedTournamentYear()).toBe(2027)
	expect(await selectedTournamentYear()).toBe(2028)
})
it("keeps explicitly requested seasons editable", async () => {
	expect(await selectedTournamentYear("2026")).toBe(2026)
	expect(readSetting).not.toHaveBeenCalled()
})
it("uses the display season for an invalid year parameter", async () => {
	readSetting.mockResolvedValue([{ value: "2027" }])
	expect(await selectedTournamentYear("invalid")).toBe(2027)
})
it("preserves the configured or calendar fallback before a display season is set", async () => {
	readSetting.mockResolvedValue([])
	expect(await selectedTournamentYear()).toBe(2026)
	vi.stubEnv("SEASON_YEAR", "2025")
	expect(await selectedTournamentYear()).toBe(2025)
})
