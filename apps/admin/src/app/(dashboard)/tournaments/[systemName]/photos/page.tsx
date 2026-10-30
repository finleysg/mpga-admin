import { H1 } from "@mpga/ui"
import { notFound } from "next/navigation"

import { selectedTournamentYear } from "@/lib/tournament-season"

import { getTournamentInstanceAction } from "../actions"
import { listPhotosAction } from "../photo-actions"
import { PhotosCard } from "../photos-card"

export default async function PhotosPage({
	params,
	searchParams,
}: {
	params: Promise<{ systemName: string }>
	searchParams: Promise<{ year?: string }>
}) {
	const { systemName } = await params

	const instanceResult = await getTournamentInstanceAction(
		systemName,
		await selectedTournamentYear((await searchParams).year),
	)
	if (!instanceResult.success || !instanceResult.data) {
		notFound()
	}

	const instance = instanceResult.data
	const year = parseInt(instance.startDate.slice(0, 4), 10)

	const photosResult = await listPhotosAction(instance.tournamentId)
	const photos = photosResult.data ?? []

	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				{instance.tournamentName} - Photos
			</H1>
			<PhotosCard
				initialPhotos={photos}
				tournamentId={instance.tournamentId}
				year={year}
				systemName={systemName}
			/>
		</div>
	)
}
