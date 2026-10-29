import { NextResponse } from "next/server"

// Invitation consumption must be atomic with account creation, never a separate public mutation.
export async function POST() {
	return NextResponse.json({ error: "Use the invitation registration form." }, { status: 410 })
}
