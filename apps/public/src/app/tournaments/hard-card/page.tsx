import { ContentCard, PrintButton } from "@mpga/ui"
import { notFound } from "next/navigation"

import { getHardCard } from "@/lib/queries/content"

export const revalidate = 86400

export default async function HardCardPage() {
	const hardCard = await getHardCard()

	if (!hardCard) {
		notFound()
	}

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<img
				src="/images/mpga-logo.png"
				alt="MPGA"
				className="hidden print:block mx-auto mb-6"
				width={200}
			/>
			<ContentCard
				heading="h1"
				title={hardCard.title}
				content={hardCard.content}
				action={<PrintButton />}
			/>
		</main>
	)
}
