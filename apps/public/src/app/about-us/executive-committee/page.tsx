import { Card, CardContent, CardHeader, CardTitle, CommitteeList, ContentCard, H2 } from "@mpga/ui"

import { getCommitteeMembers, getExecutiveCommitteeContent } from "@/lib/queries/about"

export const dynamic = "force-dynamic"

export default async function ExecutiveCommitteePage() {
	const [content, members] = await Promise.all([
		getExecutiveCommitteeContent(),
		getCommitteeMembers(),
	])

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			<div className="grid gap-8 lg:grid-cols-2">
				{content && <ContentCard heading="h1" title={content.title} content={content.content} />}
				<Card>
					<CardHeader>
						<CardTitle>
							<H2>Committee Members</H2>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<CommitteeList members={members} />
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
