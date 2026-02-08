import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Markdown } from "../Markdown"

describe("Markdown component", () => {
	it("renders ==text== as a <mark> element", () => {
		render(<Markdown content="==highlighted==" />)
		const mark = screen.getByText("highlighted")
		expect(mark.tagName).toBe("MARK")
	})

	it("renders multiple highlights as separate <mark> tags", () => {
		const { container } = render(<Markdown content="==one== and ==two==" />)
		const marks = container.querySelectorAll("mark")
		expect(marks).toHaveLength(2)
		expect(marks[0]!.textContent).toBe("one")
		expect(marks[1]!.textContent).toBe("two")
	})

	it("renders :::note admonition with correct attributes", () => {
		const content = ":::note\nThis is a note.\n:::"
		const { container } = render(<Markdown content={content} />)
		const div = container.querySelector("div[data-admonition]")
		expect(div).not.toBeNull()
		expect(div!.getAttribute("data-type")).toBe("note")
		expect(div!.classList.contains("admonition")).toBe(true)
		expect(div!.classList.contains("admonition-note")).toBe(true)
	})

	it.each(["note", "warning", "tip", "danger"] as const)(
		"renders :::%s with data-type=%s",
		(type) => {
			const content = `:::${type}\nContent here.\n:::`
			const { container } = render(<Markdown content={content} />)
			const div = container.querySelector("div[data-admonition]")
			expect(div).not.toBeNull()
			expect(div!.getAttribute("data-type")).toBe(type)
		},
	)

	it("ignores unknown directive types like :::caution", () => {
		const content = ":::caution\nSome text.\n:::"
		const { container } = render(<Markdown content={content} />)
		const div = container.querySelector("div[data-admonition]")
		expect(div).toBeNull()
	})

	it("renders admonition with multiple paragraphs", () => {
		const content = ":::tip\nFirst paragraph.\n\nSecond paragraph.\n:::"
		const { container } = render(<Markdown content={content} />)
		const div = container.querySelector("div[data-admonition]")
		expect(div).not.toBeNull()
		const paragraphs = div!.querySelectorAll("p")
		expect(paragraphs.length).toBeGreaterThanOrEqual(2)
	})

	it("strips <script> tags but preserves <mark> tags", () => {
		const content = '<script>alert("xss")</script> ==safe=='
		const { container } = render(<Markdown content={content} />)
		expect(container.querySelector("script")).toBeNull()
		expect(container.querySelector("mark")).not.toBeNull()
		expect(container.querySelector("mark")!.textContent).toBe("safe")
	})

	it("strips arbitrary data-* attributes from divs", () => {
		const content = '<div data-evil="injected">text</div>'
		const { container } = render(<Markdown content={content} />)
		const div = container.querySelector("div.prose div")
		if (div) {
			expect(div.hasAttribute("data-evil")).toBe(false)
		}
	})

	it("renders highlights inside admonition blocks", () => {
		const content = ":::note\n==highlighted inside note==\n:::"
		const { container } = render(<Markdown content={content} />)
		const admonition = container.querySelector("div[data-admonition]")
		expect(admonition).not.toBeNull()
		const mark = admonition!.querySelector("mark")
		expect(mark).not.toBeNull()
		expect(mark!.textContent).toBe("highlighted inside note")
	})
})
