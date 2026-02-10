import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getAwardAction, listAwardWinnersAction, saveAwardDescriptionAction } from "../actions"
import { WinnersCard } from "../winners-card"

export default async function AwardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: idParam } = await params
	const awardId = Number(idParam)

	const awardResult = await getAwardAction(awardId)
	if (!awardResult.success || !awardResult.data) {
		return <p>Award not found.</p>
	}

	const awardData = awardResult.data

	async function loadDescription() {
		"use server"
		const result = await getAwardAction(awardId)
		if (!result.success || !result.data) return null
		return {
			title: result.data.name,
			content: result.data.description,
			id: result.data.id,
		}
	}

	async function saveDescription(data: { id?: number; title: string; content: string }) {
		"use server"
		return saveAwardDescriptionAction({
			id: data.id ?? awardId,
			description: data.content,
		})
	}

	const winnersResult = await listAwardWinnersAction(awardId)
	const winners = winnersResult.success && winnersResult.data ? winnersResult.data : []

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<H1 variant="secondary" className="mb-6">
				{awardData.name}
			</H1>
			<ContentEditor
				loadContent={loadDescription}
				saveContent={saveDescription}
				showTitle={false}
			/>
			<WinnersCard initialWinners={winners} awardId={awardId} />
		</div>
	)
}
