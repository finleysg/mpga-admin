import { NextRequest, NextResponse } from "next/server"

import {
	contactIp,
	contactSchema,
	trustedContactRequest,
	verifyContactToken,
} from "@/lib/contact-protection"
import { storeContact } from "@/lib/contact-store"
import { sendContactNotificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
	// Only our public server can forward visitor IPs. Browser headers are not trusted.
	if (!trustedContactRequest(request.headers)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}
	const ip = contactIp(request.headers)
	if (!ip) return NextResponse.json({ error: "Unable to verify request" }, { status: 400 })

	let body: unknown
	try {
		const text = await request.text()
		if (text.length > 16000)
			return NextResponse.json({ error: "Message is too large" }, { status: 413 })
		body = JSON.parse(text)
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
	}
	const parsed = contactSchema.safeParse(body)
	if (!parsed.success)
		return NextResponse.json(
			{ error: "Please check your contact details and complete verification." },
			{ status: 400 },
		)
	const data = parsed.data
	if (data.website) return NextResponse.json({ success: true })
	if (!(await verifyContactToken(data.turnstileToken, ip))) {
		return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 })
	}
	try {
		const result = await storeContact(data, ip)
		if (result === "limited")
			return NextResponse.json(
				{ error: "Too many messages. Please wait ten minutes before trying again." },
				{ status: 429, headers: { "Retry-After": "600" } },
			)
		if (result === "duplicate") return NextResponse.json({ success: true })
		await sendContactNotificationEmail(
			data.contactName,
			data.contactEmail,
			data.contactPhone,
			data.message,
			data.course,
		)
		return NextResponse.json({ success: true })
	} catch (err) {
		console.error("Failed to process contact form:", err)
		return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
	}
}
