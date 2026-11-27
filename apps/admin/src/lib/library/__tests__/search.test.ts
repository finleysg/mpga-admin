// @vitest-environment node
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import ExcelJS from "exceljs"
import { describe, expect, it } from "vitest"

import { extractText } from "../extract"
import { highlight } from "../highlight"
import { escapeLike, parseQuery, tidySnippet } from "../search"

const fixture = (name: string) =>
	new Uint8Array(readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))))

describe("extractText", () => {
	it("reads the text layer of a PDF", async () => {
		expect(await extractText("minutes.pdf", fixture("minutes.pdf"))).toContain(
			"approved the Clasen Cup budget",
		)
	})

	it("reads Word documents", async () => {
		expect(await extractText("bylaws.docx", fixture("bylaws.docx"))).toBe(
			"Bylaws amendment: the treasurer reports quarterly.",
		)
	})

	it("reads every sheet of an Excel workbook", async () => {
		const workbook = new ExcelJS.Workbook()
		workbook.addWorksheet("Budget").addRows([
			["Item", "Amount"],
			["Prizes", 1200],
		])
		workbook.addWorksheet("Notes").addRow(["Approved by the board"])
		const bytes = new Uint8Array(await workbook.xlsx.writeBuffer())
		const text = await extractText("budget.xlsx", bytes)
		expect(text).toContain("Prizes 1200")
		expect(text).toContain("Notes\nApproved by the board")
	})

	it("reads text, CSV and markdown as-is", async () => {
		const enc = new TextEncoder()
		expect(await extractText("a.csv", enc.encode("item,amount\nprizes,1200"))).toBe(
			"item,amount\nprizes,1200",
		)
		expect(await extractText("a.md", enc.encode("# Agenda\n\n- Budget"))).toBe("# Agenda\n- Budget")
	})

	it("skips types that aren't indexed and survives broken files", async () => {
		expect(await extractText("slides.pptx", new Uint8Array([0x50, 0x4b, 3, 4]))).toBeNull()
		expect(await extractText("photo.png", new Uint8Array([0x89, 0x50]))).toBeNull()
		expect(await extractText("broken.pdf", new TextEncoder().encode("%PDF-1.7 garbage"))).toBeNull()
		expect(await extractText("broken.docx", new Uint8Array([0x50, 0x4b, 3, 4, 0]))).toBeNull()
	})
})

describe("search helpers", () => {
	it("parses terms", () => {
		expect(parseQuery("  Clasen  cup clasen a  ")).toEqual(["Clasen", "cup"])
		expect(parseQuery("a b")).toEqual([])
		expect(parseQuery("one two three four five six seven")).toHaveLength(6)
	})

	it("escapes LIKE wildcards", () => {
		expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\")
	})

	it("trims snippets to whole words with ellipses", () => {
		expect(tidySnippet("ard minutes: approved the budget for 2026 and mo", false, false)).toBe(
			"… minutes: approved the budget for 2026 and …",
		)
		expect(tidySnippet("Board minutes", true, true)).toBe("Board minutes")
	})

	it("highlights every term, ignoring case and accents", () => {
		expect(highlight("Résumé of the Resume committee", ["resume"])).toEqual([
			{ text: "Résumé", match: true },
			{ text: " of the ", match: false },
			{ text: "Resume", match: true },
			{ text: " committee", match: false },
		])
		expect(highlight("Clasen Cup", ["cup", "clasen"]).filter((p) => p.match)).toHaveLength(2)
		expect(highlight("nothing here", ["zzz"])).toEqual([{ text: "nothing here", match: false }])
	})
})
