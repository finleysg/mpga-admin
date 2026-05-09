import { club, contact, team, teamCaptain } from "@mpga/database"
import { Button, Card, CardContent, CardHeader, CardTitle, H1 } from "@mpga/ui"
import { and, asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

import { CaptainLoginForm } from "./captain-login-form"
import { CaptainPageLayout } from "./captain-page-layout"

function getCurrentYear(): number {
	const override = process.env.SEASON_YEAR
	if (override) {
		const year = parseInt(override, 10)
		if (!isNaN(year)) return year
	}
	return new Date().getFullYear()
}

export default async function CaptainLobbyPage() {
	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) {
		return <CaptainLoginForm />
	}

	const email = session.user.email
	const year = getCurrentYear()

	const teams = await db
		.select({
			id: team.id,
			groupName: team.groupName,
			isSenior: team.isSenior,
			clubName: club.name,
		})
		.from(teamCaptain)
		.innerJoin(contact, eq(teamCaptain.contactId, contact.id))
		.innerJoin(team, eq(teamCaptain.teamId, team.id))
		.innerJoin(club, eq(team.clubId, club.id))
		.where(and(eq(contact.email, email), eq(team.year, year)))
		.orderBy(asc(team.groupName), asc(club.name))

	if (teams.length === 0) {
		return (
			<CaptainPageLayout>
				<Card>
					<CardHeader>
						<CardTitle className="font-heading text-xl">No Teams Found</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							Your email <strong>{email}</strong> is not registered as a captain for the {year}{" "}
							season. If you believe this is an error, please contact{" "}
							<a href="mailto:secretary@mpga.net" className="text-secondary-600 underline">
								secretary@mpga.net
							</a>
							.
						</p>
					</CardContent>
				</Card>
			</CaptainPageLayout>
		)
	}

	if (teams.length === 1) {
		redirect(`/match-play-captain/${teams[0]!.id}`)
	}

	return (
		<CaptainPageLayout maxWidth="lg">
			<H1 className="font-heading text-2xl text-secondary-500">Choose a Team</H1>
			<p className="text-muted-foreground text-sm">
				You captain multiple teams this season. Select one to enter or review match results.
			</p>
			<div className="grid gap-3">
				{teams.map((t) => (
					<Card key={t.id} className="transition-colors hover:bg-accent">
						<CardContent className="flex items-center justify-between p-4">
							<div>
								<p className="font-heading text-lg text-secondary-500">{t.clubName}</p>
								<p className="text-muted-foreground text-sm">
									{t.groupName}
									{t.isSenior ? " (Senior)" : ""}
								</p>
							</div>
							<Button asChild variant="secondary">
								<Link href={`/match-play-captain/${t.id}`}>Open</Link>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</CaptainPageLayout>
	)
}
