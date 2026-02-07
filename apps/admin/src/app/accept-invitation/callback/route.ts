import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { acceptInvitation, validateInvitation } from "@/lib/invitation";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("invitation_token")?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  // Validate the invitation is still pending
  const invitation = await validateInvitation(token);

  if (!invitation) {
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL),
    );
    response.cookies.delete("invitation_token");
    return response;
  }

  // Verify the signed-in user's email matches the invitation
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user || session.user.email !== invitation.email) {
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL),
    );
    response.cookies.delete("invitation_token");
    return response;
  }

  // Accept the invitation
  await acceptInvitation(token);

  // Clear the invitation cookie and redirect to dashboard
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_APP_URL),
  );
  response.cookies.delete("invitation_token");
  return response;
}
