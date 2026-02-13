import { Card, CardContent, CardHeader, CardTitle } from "@mpga/ui"
import { CheckCircle } from "lucide-react"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

import { PayDuesForm } from "./pay-dues-form"
import { createPaymentIntentForContact, getClubDuesStatusForContact } from "../../actions"
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

	const statusResult = await getClubDuesStatusForContact(clubIdNum)

	if (!statusResult.success || !statusResult.data) {
		return (
			<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-md">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="font-heading text-xl">Error</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-center text-sm">
								{statusResult.error ?? "Failed to load dues status."}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	const { clubName, year, isPaid, paymentDate } = statusResult.data

	if (isPaid) {
		return (
			<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-md">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="font-heading text-xl">Dues Paid</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center gap-4">
							<CheckCircle className="text-green-600" size={48} />
							<p className="text-center text-sm">
								<strong>{clubName}</strong> dues for {year} were paid on {paymentDate}.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	const intentResult = await createPaymentIntentForContact(clubIdNum)

	if (!intentResult.success || !intentResult.data) {
		return (
			<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-md">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="font-heading text-xl">Error</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-center text-sm">
								{intentResult.error ?? "Failed to initialize payment."}
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
						<CardTitle className="font-heading text-xl">
							Pay {year} Dues — {clubName}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-6 text-center text-sm">
							Annual membership dues: <strong>$100.00</strong>
						</p>
						<PayDuesForm clientSecret={intentResult.data.clientSecret} clubId={clubIdNum} />
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
