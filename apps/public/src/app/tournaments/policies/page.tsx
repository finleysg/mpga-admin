import { ContentCard, ContentSearch, PrintButton } from "@mpga/ui"
import { notFound } from "next/navigation"

import { getTournamentPolicies } from "@/lib/queries/content"

export const dynamic = "force-dynamic"

export default async function TournamentPoliciesPage() {
	const policies = await getTournamentPolicies()

	if (!policies) {
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
			<div className="mb-4 flex items-center justify-between gap-3 print:hidden">
				<ContentSearch containerId="policies-content" />
				<PrintButton />
			</div>
			<div id="policies-content">
				<ContentCard heading="h1" title={policies.title} content={policies.content} />
			</div>
		</main>
	)
}
