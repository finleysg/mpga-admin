import { getPostHogClient } from "@/lib/posthog-server"

export async function onRequestError(
	error: { digest: string } & Error,
	request: {
		path: string
		method: string
		headers: { [key: string]: string }
	},
	context: {
		routerKind: "Pages Router" | "App Router"
		routeType: "render" | "route" | "action" | "middleware"
		routePath: string
		revalidateReason: "on-demand" | "stale" | undefined
		renderSource:
			| "react-server-components"
			| "react-server-components-payload"
			| "server-rendering"
			| undefined
	},
) {
	const posthog = getPostHogClient()
	if (!posthog) return

	const cookieHeader = request.headers["cookie"] ?? ""
	const phCookie = cookieHeader
		.split(";")
		.map((c) => c.trim())
		.find((c) => c.startsWith("ph_"))
	let distinctId = "anonymous"
	if (phCookie) {
		try {
			const value = decodeURIComponent(phCookie.split("=")[1]!)
			const parsed = JSON.parse(value)
			if (parsed.distinct_id) distinctId = parsed.distinct_id
		} catch {
			// ignore parse errors
		}
	}

	posthog.captureException(error, distinctId, {
		request_path: request.path,
		request_method: request.method,
		router_kind: context.routerKind,
		route_type: context.routeType,
		route_path: context.routePath,
	})

	await posthog.flush()
}
