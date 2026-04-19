import { Card, CardContent, CardHeader, CardTitle, H1 } from "@mpga/ui"
import { headers } from "next/headers"
import Link from "next/link"

import { auth } from "@/lib/auth"

import { getCaptainTeam, listCaptainResults, listOpponents } from "../actions"
import { CaptainLoginForm } from "../captain-login-form"
import { CaptainPageLayout } from "../captain-page-layout"
import { isCaptainOfTeam } from "../validate-captain"
import { TeamView } from "./team-view"

export default async function CaptainTeamPage({ params }: { params: Promise<{ teamId: string }> }) {
	const { teamId } = await params
	const teamIdNum = parseInt(teamId, 10)
	const callbackPath = `/match-play-captain/${teamId}`

	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) {
		return <CaptainLoginForm callbackPath={callbackPath} />
	}

	const authorized = await isCaptainOfTeam(session.user.email, teamIdNum)
	if (!authorized) {
		return <CaptainLoginForm callbackPath={callbackPath} />
	}

	const [teamResult, resultsResult, opponentsResult] = await Promise.all([
		getCaptainTeam(teamIdNum),
		listCaptainResults(teamIdNum),
		listOpponents(teamIdNum),
	])

	if (!teamResult.success || !teamResult.data) {
		return (
			<CaptainPageLayout>
				<Card>
					<CardHeader>
						<CardTitle className="font-heading text-xl">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{teamResult.error ?? "Failed to load team"}
						</p>
						<Link
							href="/match-play-captain"
							className="mt-4 inline-block text-sm text-secondary-600 underline"
						>
							Back
						</Link>
					</CardContent>
				</Card>
			</CaptainPageLayout>
		)
	}

	const team = teamResult.data
	const results = resultsResult.success && resultsResult.data ? resultsResult.data : []
	const opponents = opponentsResult.success && opponentsResult.data ? opponentsResult.data : []

	return (
		<CaptainPageLayout maxWidth="lg">
			<div>
				<H1 className="font-heading text-2xl text-secondary-500">{team.clubName}</H1>
				<p className="text-muted-foreground text-sm">
					{team.year} {team.groupName}
					{team.isSenior ? " (Senior)" : ""}
				</p>
			</div>
			<TeamView team={team} initialResults={results} opponents={opponents} />
		</CaptainPageLayout>
	)
}
