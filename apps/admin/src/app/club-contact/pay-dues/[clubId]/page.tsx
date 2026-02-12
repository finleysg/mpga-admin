import { Card, CardContent, CardHeader, CardTitle } from "@mpga/ui"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

import { ClubContactLoginForm } from "../../club-contact-login-form"
import { validateClubContact } from "../../validate-contact"

export default async function PayDuesPage({ params }: { params: Promise<{ clubId: string }> }) {
	const { clubId } = await params
	const clubIdNum = parseInt(clubId, 10)
	const callbackPath = `/club-contact/pay-dues/${clubId}`

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

	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-md">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="font-heading text-xl">Pay Dues</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-center text-sm">
							Online dues payment is coming soon. Please contact the MPGA treasurer to pay your
							annual dues.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
