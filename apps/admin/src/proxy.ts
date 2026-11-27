import { type NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
	const sessionCookie =
		request.cookies.get("__Secure-better-auth.session_token") ||
		request.cookies.get("better-auth.session_token")

	const isPublicRoute =
		request.nextUrl.pathname.startsWith("/login") ||
		request.nextUrl.pathname.startsWith("/api/auth") ||
		request.nextUrl.pathname.startsWith("/api/health") ||
		request.nextUrl.pathname.startsWith("/api/invitations/validate") ||
		request.nextUrl.pathname.startsWith("/api/invitations/accept") ||
		request.nextUrl.pathname.startsWith("/accept-invitation") ||
		request.nextUrl.pathname.startsWith("/reset-password") ||
		request.nextUrl.pathname.startsWith("/forgot-password") ||
		request.nextUrl.pathname.startsWith("/club-contact") ||
		request.nextUrl.pathname.startsWith("/match-play-captain") ||
		request.nextUrl.pathname.startsWith("/stripe/webhook") ||
		request.nextUrl.pathname.startsWith("/api/messages") ||
		request.nextUrl.pathname.startsWith("/api/captain-contacts")

	if (isPublicRoute) {
		return NextResponse.next()
	}

	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/login", request.url))
	}

	// Server layouts can't read the URL, so pass it along for role-based page gating.
	const requestHeaders = new Headers(request.headers)
	requestHeaders.set("x-pathname", request.nextUrl.pathname)
	return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
}
