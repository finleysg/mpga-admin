import { Card, CardContent, CardHeader, CardTitle } from "@mpga/ui"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

import { ClubContactsSection } from "./club-contacts-section"
import { ClubEditForm } from "./club-edit-form"
import {
	getClubForContact,
	listClubContactsForContact,
	listGolfCourseOptionsForContact,
} from "../../actions"
import { ClubContactLoginForm } from "../../club-contact-login-form"
import { validateClubContact } from "../../validate-contact"

export default async function EditClubPage({ params }: { params: Promise<{ clubId: string }> }) {
	const { clubId } = await params
	const clubIdNum = parseInt(clubId, 10)
	const callbackPath = `/club-contact/edit-club/${clubId}`

	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) {
		return <ClubContactLoginForm clubId={clubIdNum} callbackPath={callbackPath} />
	}

	const isAuthorized = await validateClubContact(clubIdNum, session.user.email)

	if (!isAuthorized) {
		return (
			<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-md">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="font-heading text-xl">Not Authorized</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-center text-sm">
								Your account is not authorized as a contact for this club.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	const [clubResult, coursesResult, contactsResult] = await Promise.all([
		getClubForContact(clubIdNum),
		listGolfCourseOptionsForContact(clubIdNum),
		listClubContactsForContact(clubIdNum),
	])

	if (!clubResult.success || !clubResult.data) {
		return (
			<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-md">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="font-heading text-xl">Error</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-center text-sm">
								{clubResult.error ?? "Failed to load club data."}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	const clubData = clubResult.data
	const golfCourses = coursesResult.success && coursesResult.data ? coursesResult.data : []
	const contacts = contactsResult.success && contactsResult.data ? contactsResult.data : []

	return (
		<div className="bg-muted min-h-svh p-4 md:p-6">
			<div className="mx-auto max-w-lg space-y-6">
				<h1 className="font-heading text-xl font-bold">Edit {clubData.name}</h1>
				<ClubEditForm club={clubData} golfCourses={golfCourses} />
				<ClubContactsSection clubId={clubIdNum} initialContacts={contacts} />
			</div>
		</div>
	)
}
