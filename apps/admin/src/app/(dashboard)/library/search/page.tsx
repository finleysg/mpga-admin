import { EmptyState, H1 } from "@mpga/ui"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { FileIcon } from "@/components/library/file-icon"
import { HighlightedText } from "@/components/library/highlighted-text"
import { LibrarySearchBox } from "@/components/library/library-search-box"
import { LocalDate } from "@/components/library/local-date"
import { db } from "@/lib/db"
import { fileHref } from "@/lib/library/links"
import { parseQuery, searchLibrary } from "@/lib/library/search"
import { requireLibraryUser } from "@/lib/require-auth"

export default async function LibrarySearchPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string | string[] }>
}) {
	const viewer = await requireLibraryUser()
	if (!viewer) redirect("/login")

	const raw = (await searchParams).q
	const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 200) ?? ""
	const terms = parseQuery(query)
	const result = terms.length ? await searchLibrary(db, viewer, query) : null
	const results = result?.ok ? result.data : []

	return (
		<div className="mx-auto max-w-4xl space-y-4">
			<Link
				href="/library"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden /> Library
			</Link>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<H1 variant="secondary">Search</H1>
				<LibrarySearchBox defaultValue={query} />
			</div>

			{!terms.length ? (
				<EmptyState message="Enter at least 2 characters to search file names and contents." />
			) : results.length === 0 ? (
				<EmptyState message={`No documents match "${query}".`} />
			) : (
				<>
					<p className="text-sm text-muted-foreground" aria-live="polite">
						{results.length === 50
							? "Showing the first 50 matches"
							: `${results.length} match${results.length === 1 ? "" : "es"}`}{" "}
						for &ldquo;{query}&rdquo;
					</p>
					<ul className="divide-y rounded-md border">
						{results.map((r) => (
							<li key={r.fileId}>
								<Link
									href={fileHref(r.fileId)}
									className="flex gap-3 px-3 py-3 hover:bg-muted/50 sm:px-4"
								>
									<FileIcon name={r.name} className="mt-0.5 h-5 w-5" />
									<div className="min-w-0 flex-1 space-y-1">
										<p className="font-medium break-words">
											<HighlightedText text={r.name} terms={terms} />
										</p>
										<p className="text-xs text-muted-foreground">
											{r.path} · <LocalDate value={r.updatedAt} />
										</p>
										{r.snippet && (
											<p className="text-sm text-muted-foreground break-words">
												<HighlightedText text={r.snippet} terms={terms} />
											</p>
										)}
									</div>
								</Link>
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	)
}
