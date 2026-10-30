import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"
import { selectedTournamentYear } from "@/lib/tournament-season"

import { getInstanceDescriptionAction, saveInstanceDescriptionAction } from "./actions"

export default async function EditDescriptionPage({
	params,
	searchParams,
}: {
	params: Promise<{ systemName: string }>
	searchParams: Promise<{ year?: string }>
}) {
	const { systemName } = await params
	const year = await selectedTournamentYear((await searchParams).year)

	async function loadContent() {
		"use server"
		const result = await getInstanceDescriptionAction(systemName, year)
		if (!result.success || !result.data) return null
		return {
			title: result.data.title,
			content: result.data.description,
			id: result.data.id,
		}
	}

	async function saveContent(data: { id?: number; title: string; content: string }) {
		"use server"
		if (data.id == null) {
			return { success: false, error: "No instance loaded" }
		}
		return saveInstanceDescriptionAction({
			instanceId: data.id,
			description: data.content,
			systemName,
		})
	}

	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				Edit Tournament Description
			</H1>
			<ContentEditor
				backHref={`/tournaments/${systemName}?year=${year}`}
				loadContent={loadContent}
				saveContent={saveContent}
				showTitle={false}
				preview={{ heading: "h2" }}
			/>
		</div>
	)
}
