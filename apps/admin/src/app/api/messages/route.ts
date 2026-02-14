import { message } from "@mpga/database"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { sendContactNotificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
	let body: {
		contactName?: string
		contactEmail?: string
		contactPhone?: string
		course?: string
		message?: string
	}
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
	}

	const { contactName, contactEmail, contactPhone, course, message: messageText } = body

	if (!contactName || !contactEmail || !messageText) {
		return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
	}

	try {
		await db.insert(message).values({
			messageDate: new Date().toISOString().slice(0, 23).replace("T", " "),
			contactName,
			contactEmail,
			contactPhone: contactPhone ?? "",
			course: course || null,
			message: messageText,
		})

		await sendContactNotificationEmail(
			contactName,
			contactEmail,
			contactPhone ?? "",
			messageText,
			course,
		)

		return NextResponse.json({ success: true })
	} catch (err) {
		console.error("Failed to process contact form:", err)
		return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
	}
}
