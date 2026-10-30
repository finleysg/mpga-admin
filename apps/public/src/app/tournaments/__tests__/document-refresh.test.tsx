// @vitest-environment node
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ documents: vi.fn() }))
vi.mock("@/lib/queries/tournaments", () => ({
	getTournamentInstance: async () => ({
		instanceId: 14,
		tournamentId: 4,
		instanceName: "Four Ball",
		instanceDescription: "Details",
	}),
	getTournamentLinks: async () => [],
	getTournamentDocuments: mocks.documents,
}))
vi.mock("@mpga/ui", () => ({
	H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
	Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	Markdown: () => null,
	RegistrationCard: () => null,
	GolfCourseCard: () => null,
	DocumentsCard: ({
		documents,
	}: {
		documents: { id: number; title: string; fileUrl: string }[]
	}) => (
		<div>
			{documents.map((document) => (
				<a key={document.id} href={document.fileUrl}>
					{document.title}
				</a>
			))}
		</div>
	),
}))
import TournamentYearPage, { dynamic } from "../[name]/[year]/page"

beforeEach(() => vi.resetAllMocks())
const renderPage = async () =>
	renderToStaticMarkup(
		await TournamentYearPage({ params: Promise.resolve({ name: "four-ball", year: "2027" }) }),
	)

it("does not serve an ISR snapshot of the document list", () => {
	expect(dynamic).toBe("force-dynamic")
})
it("shows a newly uploaded file on the next load, including a future season", async () => {
	mocks.documents
		.mockResolvedValueOnce([{ id: 1, title: "Entry form", file: null }])
		.mockResolvedValueOnce([{ id: 1, title: "Entry form", file: "documents/new-entry.pdf" }])
	expect(await renderPage()).not.toContain("Entry form")
	const after = await renderPage()
	expect(after).toContain("Entry form")
	expect(after).toContain("documents/new-entry.pdf")
	expect(mocks.documents.mock.calls).toEqual([
		[4, 2027],
		[4, 2027],
	])
})
it("shows a replacement and removes a deleted document on subsequent loads", async () => {
	mocks.documents
		.mockResolvedValueOnce([{ id: 1, title: "Entry form", file: "documents/old.pdf" }])
		.mockResolvedValueOnce([{ id: 1, title: "Entry form", file: "documents/replaced.pdf" }])
		.mockResolvedValueOnce([])
	expect(await renderPage()).toContain("documents/old.pdf")
	const replacement = await renderPage()
	expect(replacement).toContain("documents/replaced.pdf")
	expect(replacement).not.toContain("documents/old.pdf")
	expect(await renderPage()).not.toContain("Entry form")
})
