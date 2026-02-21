import { club as clubTable } from "@mpga/database"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@mpga/ui"
import { eq } from "drizzle-orm"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

import { ClubContactLoginForm } from "../../../club-contact-login-form"
import { ClubContactPageLayout } from "../../../club-contact-page-layout"
import { validateClubContact } from "../../../validate-contact"

export default async function PayDuesSuccessPage({
	params,
	searchParams,
}: {
	params: Promise<{ clubId: string }>
	searchParams: Promise<{ payment_intent?: string; payment_intent_client_secret?: string }>
}) {
	const { clubId } = await params
	const clubIdNum = parseInt(clubId, 10)
	const callbackPath = `/club-contact/pay-dues/${clubId}/success`

	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) {
		return <ClubContactLoginForm clubId={clubIdNum} callbackPath={callbackPath} />
	}

	const isAuthorized = await validateClubContact(clubIdNum, session.user.email)

	if (!isAuthorized) {
		return (
			<ClubContactPageLayout>
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
			</ClubContactPageLayout>
		)
	}

	const { payment_intent: paymentIntentId } = await searchParams

	if (!paymentIntentId) {
		return (
			<ClubContactPageLayout>
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="font-heading text-xl">Invalid Request</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-center text-sm">
							No payment information found.
						</p>
					</CardContent>
				</Card>
			</ClubContactPageLayout>
		)
	}

	const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
	const status = paymentIntent.status

	const clubs = await db
		.select({ systemName: clubTable.systemName })
		.from(clubTable)
		.where(eq(clubTable.id, clubIdNum))

	const systemName = clubs[0]?.systemName
	const publicSiteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000"
	const clubPageUrl = systemName
		? `${publicSiteUrl}/members/${systemName}`
		: `${publicSiteUrl}/members`

	return (
		<ClubContactPageLayout systemName={systemName}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="font-heading text-xl">
						{status === "succeeded" && "Payment Successful"}
						{status === "processing" && "Payment Processing"}
						{status !== "succeeded" && status !== "processing" && "Payment Failed"}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col items-center gap-4">
					{status === "succeeded" && (
						<>
							<CheckCircle className="text-green-600" size={48} />
							<p className="text-center text-sm">
								Your dues payment has been received. A confirmation email will be sent to all club
								contacts.
							</p>
							<Button asChild className="mt-2">
								<a href={clubPageUrl}>Return to Club Page</a>
							</Button>
						</>
					)}
					{status === "processing" && (
						<>
							<Clock className="text-yellow-600" size={48} />
							<p className="text-center text-sm">
								Your payment is being processed. You will receive a confirmation email once it
								completes.
							</p>
							<Button asChild className="mt-2">
								<a href={clubPageUrl}>Return to Club Page</a>
							</Button>
						</>
					)}
					{status !== "succeeded" && status !== "processing" && (
						<>
							<XCircle className="text-red-600" size={48} />
							<p className="text-center text-sm">
								Your payment could not be completed. Please try again.
							</p>
							<Button asChild variant="outline" className="mt-2">
								<Link href={`/club-contact/pay-dues/${clubId}`}>Try Again</Link>
							</Button>
						</>
					)}
				</CardContent>
			</Card>
		</ClubContactPageLayout>
	)
}
