import { NextRequest, NextResponse } from "next/server"

import { validateInvitation } from "@/lib/invitation"

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const token = searchParams.get("token")

	if (!token) {
		return NextResponse.json({ valid: false, error: "Token is required" }, { status: 400 })
	}

	const invitation = await validateInvitation(token)

	if (!invitation) {
		return NextResponse.json(
			{ valid: false, error: "This invitation link is invalid or has expired" },
			{ status: 404 },
		)
	}

	return NextResponse.json({
		valid: true,
		email: invitation.email,
		role: invitation.role,
	})
}
