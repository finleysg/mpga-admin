import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getTournamentDescriptionAction, saveTournamentDescriptionAction } from "./actions"

export default async function EditOverviewPage({
	params,
}: {
	params: Promise<{ systemName: string }>
}) {
	const { systemName } = await params

	async function loadContent() {
		"use server"
		const result = await getTournamentDescriptionAction(systemName)
		if (!result.success || !result.data) return null
		return {
			title: result.data.title,
			content: result.data.description,
			id: result.data.id,
		}
	}

	async function saveContent(data: { id?: number; title: string; content: string }) {
		"use server"
		if (!data.id) {
			return { success: false, error: "Tournament ID is required" }
		}
		return saveTournamentDescriptionAction({
			tournamentId: data.id,
			description: data.content,
		})
	}

	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				Edit Tournament Overview
			</H1>
			<p className="text-muted-foreground mb-6">
				The tournaments overview briefly describes this tournament and presents some historical
				context. This is not information that changes often and carries forward year to year. It is
				displayed on the tournament calendar page and again at the top of the tournament history
				page.
			</p>
			<ContentEditor
				backHref={`/tournaments/${systemName}`}
				loadContent={loadContent}
				saveContent={saveContent}
				showTitle={false}
				preview={{ heading: "h2" }}
			/>
		</div>
	)
}
