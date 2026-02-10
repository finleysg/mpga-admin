import { describe, expect, it } from "vitest"

import type { HistoryResult } from "../HistoryResultsTable"
import { formatChampion, formatScore } from "../HistoryResultsTable"

function makeResult(overrides: Partial<HistoryResult> = {}): HistoryResult {
	return {
		id: 1,
		year: 2024,
		location: "TPC",
		winner: "John Smith",
		winnerClub: "Oak Hill",
		division: "Open",
		score: "72",
		isMatch: false,
		isNet: false,
		...overrides,
	}
}

describe("formatChampion", () => {
	it("formats winner without co-winner", () => {
		const result = makeResult({ winner: "John Smith", winnerClub: "Oak Hill" })
		expect(formatChampion(result)).toBe("John Smith (Oak Hill)")
	})

	it("formats winner with co-winner", () => {
		const result = makeResult({
			winner: "John Smith",
			winnerClub: "Oak Hill",
			coWinner: "Jane Doe",
			coWinnerClub: "Pine Valley",
		})
		expect(formatChampion(result)).toBe("John Smith (Oak Hill) & Jane Doe (Pine Valley)")
	})

	it("treats null coWinner as no co-winner", () => {
		const result = makeResult({ coWinner: null, coWinnerClub: null })
		expect(formatChampion(result)).toBe("John Smith (Oak Hill)")
	})
})

describe("formatScore", () => {
	it("returns raw score for match play", () => {
		const result = makeResult({ score: "3&2", isMatch: true })
		expect(formatScore(result)).toBe("3&2")
	})

	it("returns score with (Net) suffix for net scoring", () => {
		const result = makeResult({ score: "72", isNet: true })
		expect(formatScore(result)).toBe("72 (Net)")
	})

	it("returns raw score when neither match nor net", () => {
		const result = makeResult({ score: "68", isMatch: false, isNet: false })
		expect(formatScore(result)).toBe("68")
	})

	it("returns raw score for match play even if isNet is also true", () => {
		const result = makeResult({ score: "2&1", isMatch: true, isNet: true })
		expect(formatScore(result)).toBe("2&1")
	})
})
