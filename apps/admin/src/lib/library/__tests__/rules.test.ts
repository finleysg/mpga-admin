// @vitest-environment node
import { describe, expect, it } from "vitest"

import { documentKey, DOCUMENT_FILE_MAX } from "../../document-keys"
import { descendantFolderIds, folderPath, visibleFolderIds, type FolderNode } from "../access"
import { checkFileBasics, MAX_FILE_BYTES, validateFile } from "../file-types"
import { cleanName, uniqueName, validateName } from "../names"
import { contentDisposition, decodeLocalToken, encodeLocalToken } from "../storage"

const bytes = (...values: number[]) => new Uint8Array(values)
const text = (s: string) => new TextEncoder().encode(s)

describe("validateFile", () => {
	it("accepts files whose contents match their extension", () => {
		expect(validateFile("minutes.pdf", text("%PDF-1.7 ...")).ok).toBe(true)
		expect(validateFile("budget.xlsx", bytes(0x50, 0x4b, 0x03, 0x04, 1, 2)).ok).toBe(true)
		expect(validateFile("old.doc", bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)).ok).toBe(
			true,
		)
		expect(validateFile("photo.JPG", bytes(0xff, 0xd8, 0xff, 0xe0)).ok).toBe(true)
		expect(validateFile("notes.md", text("# Notes\nAgenda – ✓")).ok).toBe(true)
		const webp = new Uint8Array([...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")])
		expect(validateFile("pic.webp", webp).ok).toBe(true)
	})

	it("rejects disguised and disallowed files", () => {
		expect(validateFile("evil.pdf", text("<html><script>")).ok).toBe(false)
		expect(validateFile("image.png", text("<svg onload=alert(1)>")).ok).toBe(false)
		expect(validateFile("drawing.svg", text("<svg/>")).ok).toBe(false)
		expect(validateFile("page.html", text("<html>")).ok).toBe(false)
		expect(validateFile("binary.txt", bytes(0x41, 0x00, 0x42)).ok).toBe(false)
		expect(validateFile("noext", text("hello")).ok).toBe(false)
	})

	it("enforces the size limit", () => {
		expect(checkFileBasics("a.pdf", MAX_FILE_BYTES)).toBeNull()
		expect(checkFileBasics("a.pdf", MAX_FILE_BYTES + 1)).toMatch(/up to 5\.0 MB/)
		expect(checkFileBasics("a.pdf", 0)).toMatch(/empty/)
	})
})

describe("names", () => {
	it("cleans unsafe characters", () => {
		expect(cleanName('  a/b\\c:"d"  ')).toBe("a b c d")
		expect(validateName("   ", 10).ok).toBe(false)
		expect(validateName("..", 10).ok).toBe(false)
		expect(validateName("x".repeat(11), 10).ok).toBe(false)
	})

	it("adds a (2) suffix, ignoring case like MySQL", () => {
		expect(uniqueName("Minutes.pdf", ["Agenda.pdf"])).toBe("Minutes.pdf")
		expect(uniqueName("Minutes.pdf", ["minutes.PDF"])).toBe("Minutes (2).pdf")
		expect(uniqueName("Minutes.pdf", ["Minutes.pdf", "Minutes (2).pdf"])).toBe("Minutes (3).pdf")
		expect(uniqueName("README", ["README"])).toBe("README (2)")
	})

	it("treats names that differ only by accents or case as the same, like the database", () => {
		expect(uniqueName("résumé.PDF", ["Resume.pdf"])).toBe("résumé (2).PDF")
	})

	it("shortens the stem so keep-both names fit the column", () => {
		const long = `${"a".repeat(196)}.pdf` // 200 characters, the maximum
		const second = uniqueName(long, [long])
		expect(second).toHaveLength(200)
		expect(second.endsWith("a (2).pdf")).toBe(true)
		const third = uniqueName(long, [long, second])
		expect(third).toHaveLength(200)
		expect(third.endsWith(" (3).pdf")).toBe(true)
	})

	it("never splits an emoji when shortening", () => {
		const name = `${"😀".repeat(100)}.pdf`
		const result = uniqueName(name, [name], 20)
		expect(Array.from(result)).toHaveLength(20)
		expect(result).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/)
	})
})

describe("visibleFolderIds", () => {
	const folder = (id: number, parentId: number | null, isRestricted = false): FolderNode => ({
		id,
		parentId,
		isRestricted,
		deletedAt: null,
	})
	// 1 Board (open) > 2 Exec (restricted: alice, bob) > 3 Personnel (restricted: alice)
	// 4 Minutes (open) ; 5 Trash (deleted, open)
	const folders = [
		folder(1, null),
		folder(2, 1, true),
		folder(3, 2, true),
		folder(4, null),
		{ ...folder(5, null), deletedAt: new Date() },
		folder(6, 5),
	]
	const memberships = new Map([
		[2, new Set(["alice", "bob"])],
		[3, new Set(["alice", "carol"])],
	])
	const sees = (id: string, isDocumentAdmin = false) =>
		[...visibleFolderIds(folders, memberships, { id, isDocumentAdmin })].sort()

	it("requires membership in every restricted ancestor", () => {
		expect(sees("alice")).toEqual([1, 2, 3, 4])
		expect(sees("bob")).toEqual([1, 2, 4])
		// carol is listed on Personnel but not on Exec above it
		expect(sees("carol")).toEqual([1, 4])
		expect(sees("dave")).toEqual([1, 4])
	})

	it("lets document admins see every live folder", () => {
		expect(sees("admin", true)).toEqual([1, 2, 3, 4])
	})

	it("hides folders in Trash and their contents unless asked", () => {
		const all = visibleFolderIds(
			folders,
			memberships,
			{ id: "admin", isDocumentAdmin: true },
			{
				includeDeleted: true,
			},
		)
		expect(all.has(5) && all.has(6)).toBe(true)
	})

	it("treats cycles and missing parents as invisible", () => {
		const broken = [folder(10, 11), folder(11, 10), folder(12, 99)]
		expect(visibleFolderIds(broken, new Map(), { id: "x", isDocumentAdmin: true }).size).toBe(0)
	})

	it("walks descendants and paths", () => {
		expect([...descendantFolderIds(folders, 1)].sort()).toEqual([1, 2, 3])
		expect(folderPath(folders, 3).map((f) => f.id)).toEqual([1, 2, 3])
	})
})

describe("local signed links", () => {
	const request = {
		key: "library/abc",
		fileName: "Minutes.pdf",
		contentType: "application/pdf",
		disposition: "inline" as const,
		expires: Date.now() + 60_000,
	}

	it("round-trips a valid token", () => {
		expect(decodeLocalToken(encodeLocalToken(request))).toEqual(request)
	})

	it("rejects expired or tampered tokens", () => {
		expect(decodeLocalToken(encodeLocalToken({ ...request, expires: Date.now() - 1 }))).toBeNull()
		const [payload, sig] = encodeLocalToken(request).split(".")
		const forged = Buffer.from(JSON.stringify({ ...request, key: "library/other" })).toString(
			"base64url",
		)
		expect(decodeLocalToken(`${forged}.${sig}`)).toBeNull()
		expect(decodeLocalToken(`${payload}.`)).toBeNull()
		expect(decodeLocalToken("garbage")).toBeNull()
	})

	it("builds a safe Content-Disposition header", () => {
		expect(contentDisposition("attachment", 'Q1 "Report" – final.pdf')).toBe(
			`attachment; filename="Q1 _Report_ _ final.pdf"; filename*=UTF-8''Q1%20%22Report%22%20%E2%80%93%20final.pdf`,
		)
	})
})

describe("documentKey", () => {
	const prefix = "documents/1795800000000-1234567-0611e6d7-"

	it("leaves short names alone (but URL-safe)", () => {
		expect(documentKey(prefix, "Entry Form.pdf")).toBe(`${prefix}Entry_Form.pdf`)
	})

	it("shortens long names to fit document.file, keeping the prefix and extension", () => {
		const key = documentKey(prefix, `${"a".repeat(196)}.pdf`)
		expect(key).toHaveLength(DOCUMENT_FILE_MAX)
		expect(key.startsWith(prefix)).toBe(true)
		expect(key.endsWith("a.pdf")).toBe(true)
	})

	it("doesn't mistake a long dotted tail for an extension", () => {
		const key = documentKey(prefix, `report.${"x".repeat(300)}`)
		expect(key).toHaveLength(DOCUMENT_FILE_MAX)
		expect(key.startsWith(`${prefix}report.`)).toBe(true)
	})
})
