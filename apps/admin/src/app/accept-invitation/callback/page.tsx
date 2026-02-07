import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { acceptInvitation, validateInvitation } from "@/lib/invitation";

export default async function AcceptInvitationCallbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("invitation_token")?.value;

  if (!token) {
    redirect("/login");
  }

  // Validate the invitation is still pending
  const invitation = await validateInvitation(token);

  if (!invitation) {
    // Clear the cookie since the token is invalid
    cookieStore.delete("invitation_token");
    redirect("/login");
  }

  // Accept the invitation
  await acceptInvitation(token);

  // Clear the invitation cookie
  cookieStore.delete("invitation_token");

  // Redirect to the dashboard
  redirect("/");
}
