/**
 * Warms up dev servers by triggering Next.js compilation of key routes
 * before any tests run. This prevents cold-start timeouts in tests.
 */
export default async function globalSetup() {
	const warmupUrls = [
		// Public site
		"http://localhost:4000/",
		// Admin: login page, session API, invitation, dashboard, and clubs
		"http://localhost:4100/login",
		"http://localhost:4100/api/auth/get-session",
		"http://localhost:4100/accept-invitation/warmup",
		"http://localhost:4100/",
		"http://localhost:4100/members/clubs",
		"http://localhost:4100/members/contacts",
		"http://localhost:4100/tournaments/four-ball",
		"http://localhost:4000/tournaments/four-ball/2026",
	]

	console.log("Warming up dev servers...")
	await Promise.all(
		warmupUrls.map(async (url) => {
			try {
				const res = await fetch(url)
				console.log(`  ${url} -> ${res.status}`)
			} catch (err) {
				console.warn(`  ${url} -> failed: ${err}`)
			}
		}),
	)
	console.log("Warmup complete.")
}
