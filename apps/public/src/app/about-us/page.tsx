import { ContentCard } from "@mpga/ui"

import { getAboutUsContent } from "@/lib/queries/about"

export const dynamic = "force-dynamic"

export default async function AboutUsPage() {
	const content = await getAboutUsContent()

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{content && <ContentCard heading="h1" title={content.title} content={content.content} />}
		</div>
	)
}
