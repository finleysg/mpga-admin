import { getMediaUrl } from "@mpga/types"
import {
	Card,
	CardContent,
	ContentCard,
	DocumentsCard,
	GolfCourseCard,
	H1,
	Markdown,
	PrintButton,
	RegistrationCard,
} from "@mpga/ui"
import { notFound } from "next/navigation"

import { getTournamentPolicies } from "@/lib/queries/content"
import {
	getTournamentInstance,
	getTournamentLinks,
	getTournamentDocuments,
} from "@/lib/queries/tournaments"

export const revalidate = 86400 // 24 hours — safety net; admin triggers on-demand revalidation
export const dynamicParams = true

export async function generateStaticParams() {
	return []
}

type Params = Promise<{ name: string; year: string }>

export default async function TournamentYearPage({ params }: { params: Params }) {
	const { name, year } = await params

	if (!/^\d{4}$/.test(year)) {
		notFound()
	}
	const yearNum = parseInt(year, 10)

	const instance = await getTournamentInstance(name, yearNum)

	if (!instance) {
		notFound()
	}

	const [links, documents, policies] = await Promise.all([
		getTournamentLinks(instance.instanceId),
		getTournamentDocuments(instance.tournamentId, yearNum),
		getTournamentPolicies(),
	])

	const tournamentLinks = links.map((link) => ({
		id: link.id,
		linkType: link.linkType,
		url: link.url,
		title: link.title,
	}))

	const documentItems = documents
		.filter((doc) => doc.file)
		.map((doc) => ({
			id: doc.id,
			title: doc.title,
			fileUrl: getMediaUrl(doc.file) ?? "",
		}))

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<H1 className="mb-2 print:hidden">{instance.instanceName}</H1>

			<div className="flex flex-col gap-8 lg:flex-row">
				<div className="lg:w-[70%]">
					<Card className="print:hidden">
						<CardContent>
							<Markdown content={instance.instanceDescription} />
						</CardContent>
					</Card>

					{policies && (
						<ContentCard
							heading="h2"
							title={policies.title}
							content={policies.content}
							className="mt-6"
							action={<PrintButton />}
						/>
					)}
				</div>

				<div className="flex flex-col gap-6 print:hidden lg:w-[30%]">
					<RegistrationCard
						registrationStart={instance.registrationStart}
						registrationEnd={instance.registrationEnd}
						links={tournamentLinks}
					/>

					<DocumentsCard documents={documentItems} />

					<GolfCourseCard
						name={instance.venueName}
						address={instance.venueAddress}
						city={instance.venueCity}
						state={instance.venueState}
						zip={instance.venueZip}
						websiteUrl={instance.venueWebsiteUrl || null}
						email={instance.venueEmail || null}
						phone={instance.venuePhone || null}
						logoUrl={getMediaUrl(instance.venueLogo)}
						notes={instance.venueNotes}
					/>
				</div>
			</div>
		</main>
	)
}
