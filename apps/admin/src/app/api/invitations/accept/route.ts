import { NextRequest, NextResponse } from "next/server";

import { acceptInvitation } from "@/lib/invitation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  await acceptInvitation(token);

  return NextResponse.json({ success: true });
}
