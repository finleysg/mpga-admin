import { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { Markdown, type MarkdownStorage } from "tiptap-markdown"
import { expect, it } from "vitest"

import { tableExtensions } from "../table"

function create(content = "") {
	return new Editor({
		extensions: [StarterKit.configure({ trailingNode: false }), ...tableExtensions, Markdown],
		content,
	})
}
function markdown(editor: Editor) {
	return (editor.storage as unknown as { markdown: MarkdownStorage }).markdown.getMarkdown()
}
it("preserves a Markdown table and inline formatting through saving and reopening", () => {
	const editor = create(
		"| Team | Score |\n| :--- | ---: |\n| **Winners** | [Results](https://example.com) |\n| A \\| B | 72 |",
	)
	const reopened = create(markdown(editor))
	try {
		expect(editor.getHTML()).toContain("<table")
		expect(reopened.getJSON()).toEqual(editor.getJSON())
		expect(reopened.getHTML()).toContain("<strong>Winners</strong>")
		expect(reopened.getHTML()).toContain("A | B")
	} finally {
		editor.destroy()
		reopened.destroy()
	}
})
it("inserts a table, adds and removes rows and columns, and deletes it", () => {
	const editor = create()
	try {
		expect(editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })).toBe(true)
		expect(editor.commands.addRowAfter()).toBe(true)
		expect(editor.commands.addColumnAfter()).toBe(true)
		let table = editor.state.doc.firstChild!
		expect(table.childCount).toBe(4)
		expect(table.firstChild!.childCount).toBe(4)
		expect(editor.commands.deleteRow()).toBe(true)
		expect(editor.commands.deleteColumn()).toBe(true)
		table = editor.state.doc.firstChild!
		expect(table.childCount).toBe(3)
		expect(table.firstChild!.childCount).toBe(3)
		expect(editor.commands.deleteTable()).toBe(true)
		expect(editor.getHTML()).not.toContain("<table")
	} finally {
		editor.destroy()
	}
})

it("preserves a pipe inside inline code", () => {
	const editor = create("| Code |\n| --- |\n| `a \\| b` |")
	const reopened = create(markdown(editor))
	try {
		expect(reopened.getJSON()).toEqual(editor.getJSON())
	} finally {
		editor.destroy()
		reopened.destroy()
	}
})

it("preserves merged cells and multiline content using HTML fallback", () => {
	const editor = create(
		'<table><tr><th colspan="2"><p>Header</p></th></tr><tr><td><p>First</p><p>Second</p></td><td><p>Last</p></td></tr></table>',
	)
	const reopened = create(markdown(editor))
	try {
		expect(reopened.getJSON()).toEqual(editor.getJSON())
	} finally {
		editor.destroy()
		reopened.destroy()
	}
})
