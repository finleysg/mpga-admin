import { Card, CardContent, CardHeader, CardTitle } from "@mpga/ui"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

import { ClubContactsSection } from "./club-contacts-section"
import { listRolesForContact } from "../../actions"
import { ClubEditForm } from "./club-edit-form"
import {
	getClubForContact,
	listClubContactsForContact,
	listGolfCourseOptionsForContact,
} from "../../actions"
import { ClubContactLoginForm } from "../../club-contact-login-form"
import { ClubContactPageLayout } from "../../club-contact-page-layout"
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
		return <ClubContactLoginForm clubId={clubIdNum} callbackPath={callbackPath} />
	}

	const [clubResult, coursesResult, contactsResult, rolesResult] = await Promise.all([
		getClubForContact(clubIdNum),
		listGolfCourseOptionsForContact(clubIdNum),
		listClubContactsForContact(clubIdNum),
		listRolesForContact(clubIdNum),
	])

	if (!clubResult.success || !clubResult.data) {
		return (
			<ClubContactPageLayout>
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
			</ClubContactPageLayout>
		)
	}

	const clubData = clubResult.data
	const golfCourses = coursesResult.success && coursesResult.data ? coursesResult.data : []
	const contacts = contactsResult.success && contactsResult.data ? contactsResult.data : []
	const roles = rolesResult.success && rolesResult.data ? rolesResult.data : []

	return (
		<ClubContactPageLayout systemName={clubData.systemName} maxWidth="lg">
			<h1 className="font-heading text-xl font-bold">Edit {clubData.name}</h1>
			<p>
				Thank you for helping us keep our records up to date. You can update your club information
				below. You can also update contact information for your club if there have been any changes.
				If you need to add a contact that is not in our system, you will need to send that request
				to secretary@mpga.net.
			</p>
			<ClubEditForm club={clubData} golfCourses={golfCourses} />
			<ClubContactsSection clubId={clubIdNum} initialContacts={contacts} availableRoles={roles} />
		</ClubContactPageLayout>
	)
}
