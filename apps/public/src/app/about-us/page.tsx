import { getMediaUrl } from "@mpga/types"
import { ContentCard, DownloadLink } from "@mpga/ui"

import { getAboutUsContent, getByLawsDocument } from "@/lib/queries/about"

export const dynamic = "force-dynamic"

export default async function AboutUsPage() {
	const [content, bylawsDoc] = await Promise.all([getAboutUsContent(), getByLawsDocument()])

	const bylawsFooter = bylawsDoc ? (
		<DownloadLink href={getMediaUrl(bylawsDoc.file) ?? ""} title={bylawsDoc.title} />
	) : null

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{content && (
				<ContentCard
					heading="h1"
					title={content.title}
					content={content.content}
					footer={bylawsFooter}
				/>
			)}
		</div>
	)
}
