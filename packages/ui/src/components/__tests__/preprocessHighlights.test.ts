import { describe, expect, it } from "vitest"

import { preprocessHighlights } from "../Markdown"

describe("preprocessHighlights", () => {
	it("converts basic ==text== to <mark> tags", () => {
		expect(preprocessHighlights("==hello==")).toBe("<mark>hello</mark>")
	})

	it("converts multiple highlights in one string", () => {
		expect(preprocessHighlights("==one== and ==two==")).toBe(
			"<mark>one</mark> and <mark>two</mark>",
		)
	})

	it("handles adjacent highlights separated by a space", () => {
		expect(preprocessHighlights("==first== ==second==")).toBe(
			"<mark>first</mark> <mark>second</mark>",
		)
	})

	it("leaves empty markers ==== unchanged", () => {
		expect(preprocessHighlights("====")).toBe("====")
	})

	it("allows single = inside highlight (==a=b==)", () => {
		expect(preprocessHighlights("==a=b==")).toBe("<mark>a=b</mark>")
	})

	it("returns string unchanged when no highlights present", () => {
		const input = "no highlights here = or =here"
		expect(preprocessHighlights(input)).toBe(input)
	})

	it("does not match across newlines", () => {
		const input = "==start\nend=="
		expect(preprocessHighlights(input)).toBe(input)
	})

	it("handles content with HTML special characters", () => {
		expect(preprocessHighlights('==<b>&amp;"==')).toBe('<mark><b>&amp;"</mark>')
	})
})
