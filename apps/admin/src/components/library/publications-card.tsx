import { getMediaUrl } from "@mpga/types"
import { Card, CardContent, CardHeader, CardTitle, H2 } from "@mpga/ui"
import { AlertTriangle, ExternalLink } from "lucide-react"

import type { Publication } from "@/lib/library/publish"

import { LocalDate } from "./local-date"
import { RepublishButton } from "./republish-button"

function where(p: Publication): string {
	const parts = [p.tournamentName, p.documentType, p.year ? String(p.year) : null].filter(Boolean)
	return parts.join(" · ")
}

/** Public pages showing a copy of this file. Copies are snapshots of one version. */
export function PublicationsCard({
	fileId,
	publications,
	currentVersionNo,
	canRepublish,
}: {
	fileId: number
	publications: Publication[]
	currentVersionNo: number
	canRepublish: boolean
}) {
	if (publications.length === 0) return null
	const outdated = publications.filter((p) => !p.isCurrent).length

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<H2 variant="secondary">Published</H2>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<ul className="space-y-3 text-sm">
					{publications.map((p) => {
						const url = getMediaUrl(p.file)
						return (
							<li key={p.documentId}>
								<span className="block font-medium">{p.title}</span>
								<span className="block text-xs text-muted-foreground">{where(p)}</span>
								<span className="block text-xs text-muted-foreground">
									v{p.versionNo} published <LocalDate value={p.publishedAt} />
									{!p.isCurrent && (
										<span className="ml-1 inline-flex items-center gap-1 text-amber-700">
											<AlertTriangle className="h-3 w-3" aria-hidden /> current is v
											{currentVersionNo}
										</span>
									)}
								</span>
								{url && (
									<a
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
									>
										<ExternalLink className="h-3 w-3" aria-hidden /> Public copy
									</a>
								)}
							</li>
						)
					})}
				</ul>
				{canRepublish && outdated > 0 && <RepublishButton fileId={fileId} count={outdated} />}
			</CardContent>
		</Card>
	)
}
