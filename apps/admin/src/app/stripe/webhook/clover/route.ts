import { club, clubContact, contact, membership } from "@mpga/database"
import { and, eq } from "drizzle-orm"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { sendDuesPaymentEmail } from "@/lib/email"
import { getStripe } from "@/lib/stripe"

export async function POST(request: Request) {
	const body = await request.text()
	const signature = request.headers.get("stripe-signature")

	if (!signature) {
		return NextResponse.json({ error: "Missing signature" }, { status: 400 })
	}

	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		console.error("STRIPE_WEBHOOK_SECRET environment variable is not set")
		return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
	}

	let event
	try {
		event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
	} catch (err) {
		console.error("Webhook signature verification failed:", err)
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
	}

	if (event.type === "payment_intent.succeeded") {
		const paymentIntent = event.data.object

		if (!paymentIntent.metadata.clubId || !paymentIntent.metadata.year) {
			console.error("Missing metadata on payment intent", paymentIntent.id)
			return NextResponse.json({ received: true })
		}

		const clubId = parseInt(paymentIntent.metadata.clubId, 10)
		const year = parseInt(paymentIntent.metadata.year, 10)

		try {
			// Idempotency: check if membership already exists
			const existing = await db
				.select({ id: membership.id })
				.from(membership)
				.where(and(eq(membership.clubId, clubId), eq(membership.year, year)))

			if (existing.length > 0) {
				return NextResponse.json({ received: true })
			}

			// Create membership record
			const today = new Date().toISOString().split("T")[0]!
			await db.insert(membership).values({
				clubId,
				year,
				paymentDate: today,
				paymentType: "OL",
				paymentCode: paymentIntent.id,
				createDate: sql`NOW(6)`,
			})

			// Get club name and contact emails
			const clubs = await db.select({ name: club.name }).from(club).where(eq(club.id, clubId))
			const clubName = clubs[0]?.name ?? "Unknown Club"

			const contacts = await db
				.select({ email: contact.email })
				.from(clubContact)
				.innerJoin(contact, eq(clubContact.contactId, contact.id))
				.where(eq(clubContact.clubId, clubId))

			const emails = contacts.map((c) => c.email).filter((e): e is string => !!e)

			if (emails.length > 0) {
				await sendDuesPaymentEmail(emails, clubName, year)
			}
		} catch (err) {
			console.error("Failed to process payment_intent.succeeded:", err)
			return NextResponse.json({ error: "Processing failed" }, { status: 500 })
		}
	}

	return NextResponse.json({ received: true })
}
