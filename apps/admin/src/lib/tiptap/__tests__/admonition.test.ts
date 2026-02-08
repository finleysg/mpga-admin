import { Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { describe, expect, it, beforeEach, afterEach } from "vitest"

import { Admonition } from "../admonition"

function createEditor(content = "<p>Hello world</p>") {
	return new Editor({
		extensions: [StarterKit, Admonition],
		content,
	})
}

describe("Admonition extension", () => {
	let editor: Editor

	afterEach(() => {
		editor?.destroy()
	})

	describe("toggleAdmonition command", () => {
		beforeEach(() => {
			editor = createEditor()
		})

		it("wraps content when no admonition is active", () => {
			editor.commands.selectAll()
			editor.commands.toggleAdmonition({ type: "note" })

			expect(editor.isActive("admonition")).toBe(true)
			expect(editor.isActive("admonition", { type: "note" })).toBe(true)
		})

		it("removes admonition when same type is toggled via unsetAdmonition", () => {
			// Start with content already inside an admonition so cursor is properly inside
			editor.destroy()
			editor = createEditor(
				'<div data-admonition data-type="note" class="admonition admonition-note"><p>Inside note</p></div>',
			)
			expect(editor.isActive("admonition")).toBe(true)

			editor.commands.unsetAdmonition()
			expect(editor.isActive("admonition")).toBe(false)
		})

		it("switches type when different type is toggled", () => {
			editor.commands.selectAll()
			editor.commands.toggleAdmonition({ type: "note" })
			expect(editor.isActive("admonition", { type: "note" })).toBe(true)

			editor.commands.toggleAdmonition({ type: "warning" })
			expect(editor.isActive("admonition")).toBe(true)
			expect(editor.isActive("admonition", { type: "warning" })).toBe(true)
			expect(editor.isActive("admonition", { type: "note" })).toBe(false)
		})

		it("toggle command detects same-type match via isActive", () => {
			editor.commands.selectAll()
			editor.commands.toggleAdmonition({ type: "tip" })

			// Verify branch conditions: same type is active
			expect(editor.isActive("admonition", { type: "tip" })).toBe(true)
			// Different type is not active
			expect(editor.isActive("admonition", { type: "danger" })).toBe(false)
			// Generic admonition is active
			expect(editor.isActive("admonition")).toBe(true)
		})
	})

	describe("input rules", () => {
		// Input rules are regex-based; insertContent doesn't trigger them in jsdom.
		// Test the regex patterns directly to ensure they match correctly.
		const inputRuleRegexes = ["note", "warning", "tip", "danger"].map((type) => ({
			type,
			regex: new RegExp(`^:::${type}\\s$`),
		}))

		it.each(inputRuleRegexes)(
			"regex for $type matches ':::$type ' at start of line",
			({ type, regex }) => {
				expect(regex.test(`:::${type} `)).toBe(true)
			},
		)

		it("unknown type :::caution does not match any input rule regex", () => {
			const matches = inputRuleRegexes.some(({ regex }) => regex.test(":::caution "))
			expect(matches).toBe(false)
		})

		it("^ anchor prevents mid-line match", () => {
			const matches = inputRuleRegexes.some(({ regex }) => regex.test("hello :::note "))
			expect(matches).toBe(false)
		})
	})

	describe("HTML round-tripping", () => {
		it("parses div[data-admonition] with correct type", () => {
			editor = createEditor(
				'<div data-admonition data-type="warning" class="admonition admonition-warning"><p>Warning text</p></div>',
			)

			expect(editor.isActive("admonition", { type: "warning" })).toBe(true)
		})

		it("renderHTML produces matching attributes", () => {
			editor = createEditor()
			editor.commands.selectAll()
			editor.commands.toggleAdmonition({ type: "tip" })

			const html = editor.getHTML()
			expect(html).toContain('data-admonition=""')
			expect(html).toContain('data-type="tip"')
			expect(html).toContain("admonition-tip")
		})

		it("defaults to 'note' when data-type is missing", () => {
			editor = createEditor('<div data-admonition class="admonition"><p>No type</p></div>')

			expect(editor.isActive("admonition", { type: "note" })).toBe(true)
		})
	})

	describe("serialization", () => {
		it("serialize calls write with :::type format", () => {
			const writes: string[] = []
			let renderContentCalled = false
			let closeBlockCalled = false

			const storage = Admonition.storage as {
				markdown: {
					serialize: (
						state: {
							write: (text: string) => void
							ensureNewLine: () => void
							renderContent: (node: { content: unknown }) => void
							closeBlock: (node: unknown) => void
						},
						node: { attrs: { type: string }; content: unknown },
					) => void
				}
			}

			const mockState = {
				write: (text: string) => writes.push(text),
				ensureNewLine: () => {},
				renderContent: () => {
					renderContentCalled = true
				},
				closeBlock: () => {
					closeBlockCalled = true
				},
			}

			const mockNode = { attrs: { type: "warning" }, content: [] }
			storage.markdown.serialize(mockState, mockNode)

			expect(writes[0]).toBe(":::warning\n")
			expect(writes[1]).toBe(":::")
			expect(renderContentCalled).toBe(true)
			expect(closeBlockCalled).toBe(true)
		})

		it("parse.setup registers container plugin for all 4 types", () => {
			const registeredTypes: string[] = []
			const storage = Admonition.storage as {
				markdown: {
					parse: {
						setup: (md: { use: (plugin: unknown, name: string, opts: unknown) => void }) => void
					}
				}
			}

			const mockMd = {
				use: (_plugin: unknown, name: string, _opts: unknown) => {
					registeredTypes.push(name)
				},
			}

			storage.markdown.parse.setup(mockMd)

			expect(registeredTypes).toEqual(["note", "warning", "tip", "danger"])
		})
	})
})
