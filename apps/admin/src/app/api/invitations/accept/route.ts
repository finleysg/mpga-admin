import { NextRequest, NextResponse } from "next/server"

import { acceptInvitation, validateInvitation } from "@/lib/invitation"

export async function POST(request: NextRequest) {
	let body: { token?: string }
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
	}

	const { token } = body

	if (!token) {
		return NextResponse.json({ error: "Token is required" }, { status: 400 })
	}

	const inv = await validateInvitation(token)
	if (!inv) {
		return NextResponse.json({ error: "Invitation is invalid or has expired" }, { status: 400 })
	}

	const accepted = await acceptInvitation(token)
	if (!accepted) {
		return NextResponse.json({ error: "Failed to accept invitation" }, { status: 400 })
	}

	return NextResponse.json({ success: true })
}
