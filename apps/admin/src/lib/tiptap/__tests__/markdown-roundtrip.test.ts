import { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { Markdown, type MarkdownStorage } from "tiptap-markdown"
import { expect, it, vi } from "vitest"

import { Admonition } from "../admonition"
import { HighlightWithMarkdown } from "../highlight"

it("preserves links, highlights and admonitions through markdown editing", () => {
	const editor = new Editor({
		extensions: [
			StarterKit.configure({ trailingNode: false }),
			Markdown,
			HighlightWithMarkdown,
			Admonition,
		],
		content: ":::note\nA ==highlight== and [link](https://example.com).\n:::",
	})
	try {
		const markdown = (
			editor.storage as unknown as { markdown: MarkdownStorage }
		).markdown.getMarkdown()
		expect(markdown).toContain(":::note")
		expect(markdown).toContain("==highlight==")
		expect(markdown).toContain("[link](https://example.com)")
		expect(editor.getHTML()).toContain("data-admonition")
	} finally {
		editor.destroy()
		vi.unstubAllGlobals()
	}
})
it("drops executable attributes when HTML is pasted", () => {
	vi.stubGlobal("ClipboardEvent", class extends Event {})
	const editor = new Editor({
		extensions: [StarterKit.configure({ trailingNode: false }), Admonition],
		content: "<p>Safe</p>",
	})
	try {
		editor.view.pasteHTML(
			'<p onclick="alert(1)">Pasted<script>alert(1)</script><a href="javascript:alert(1)">link</a></p>',
		)
		expect(editor.getHTML()).not.toMatch(/onclick|<script|javascript:/)
	} finally {
		editor.destroy()
		vi.unstubAllGlobals()
	}
})
