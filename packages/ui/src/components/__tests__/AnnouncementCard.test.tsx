import { render, screen } from "@testing-library/react"
import { expect, it } from "vitest"

import { AnnouncementCard } from "../AnnouncementCard"

const announcement = {
	id: 144,
	title: "Tournament schedule",
	createDate: "2026-10-29T12:00:00Z",
	text: "| Tournament | Date |\n| --- | --- |\n| **Four Ball** | June 1 |\n\n[Details](https://example.com)",
}

it("renders the full news announcement as Markdown, including tables", () => {
	const { container } = render(<AnnouncementCard {...announcement} truncate={false} />)
	expect(container.querySelector("#announcement-144 table")).not.toBeNull()
	expect(container.querySelectorAll("th")).toHaveLength(2)
	expect(container.querySelector("td strong")).toHaveTextContent("Four Ball")
	expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute(
		"href",
		"https://example.com",
	)
	expect(container.querySelector(".max-h-40")).toBeNull()
})

it("renders formatted previews with a link to the full announcement", () => {
	const { container } = render(<AnnouncementCard {...announcement} />)
	expect(container.querySelector("table")).not.toBeNull()
	expect(container.querySelector(".max-h-40")).not.toBeNull()
	expect(screen.getByRole("link", { name: "Read More" })).toHaveAttribute(
		"href",
		"/news#announcement-144",
	)
})

it("sanitizes announcement HTML instead of executing it", () => {
	const { container } = render(
		<AnnouncementCard
			{...announcement}
			text={'<table><tr><td onclick="alert(1)">Safe<script>alert(1)</script></td></tr></table>'}
			truncate={false}
		/>,
	)
	expect(container.querySelector("td")).toHaveTextContent("Safe")
	expect(container.querySelector("td")).not.toHaveAttribute("onclick")
	expect(container.querySelector("script")).toBeNull()
})
