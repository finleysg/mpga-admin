import { Button, H1 } from "@mpga/ui"
import { ImageIcon, Pencil, Trophy } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
	getTournamentInstanceAction,
	listDocumentsAction,
	listGolfCoursesAction,
	listTournamentLinksAction,
} from "./actions"
import { DocumentsCard } from "./documents-card"
import { InstanceForm } from "./instance-form"
import { LinksCard } from "./links-card"

export default async function TournamentInstancePage({
	params,
}: {
	params: Promise<{ systemName: string }>
}) {
	const { systemName } = await params

	const [instanceResult, coursesResult] = await Promise.all([
		getTournamentInstanceAction(systemName),
		listGolfCoursesAction(),
	])

	if (!instanceResult.success || !instanceResult.data) {
		notFound()
	}

	const instance = instanceResult.data
	const courses = coursesResult.data ?? []

	const [linksResult, documentsResult] = await Promise.all([
		listTournamentLinksAction(instance.id),
		listDocumentsAction(instance.tournamentId, parseInt(instance.startDate.slice(0, 4), 10)),
	])

	const links = linksResult.data ?? []
	const documents = documentsResult.data ?? []
	const basePath = `/tournaments/${systemName}`

	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				{instance.tournamentName}
			</H1>

			<div className="mb-6 flex flex-wrap gap-2">
				<Button variant="secondaryoutline" asChild>
					<Link href={`${basePath}/overview`}>
						<Pencil className="mr-2 h-4 w-4" />
						Edit Overview
					</Link>
				</Button>
				<Button variant="secondaryoutline" asChild>
					<Link href={`${basePath}/description`}>
						<Pencil className="mr-2 h-4 w-4" />
						Edit Description
					</Link>
				</Button>
				<Button variant="secondaryoutline" asChild>
					<Link href={`${basePath}/results`}>
						<Trophy className="mr-2 h-4 w-4" />
						Enter Results
					</Link>
				</Button>
				<Button variant="secondaryoutline" asChild>
					<Link href={`${basePath}/photos`}>
						<ImageIcon className="mr-2 h-4 w-4" />
						Upload Photos
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<InstanceForm instance={instance} courses={courses} systemName={systemName} />
				<DocumentsCard
					initialDocuments={documents}
					tournamentId={instance.tournamentId}
					year={parseInt(instance.startDate.slice(0, 4), 10)}
					systemName={systemName}
				/>
				<LinksCard initialLinks={links} instanceId={instance.id} systemName={systemName} />
			</div>
		</div>
	)
}
