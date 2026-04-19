import { Button } from "@mpga/ui"

export function CaptainEntryButton() {
	const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:4100"
	return (
		<Button asChild variant="outline" size="sm">
			<a href={`${adminUrl}/match-play-captain`}>Captains: Enter Match Result</a>
		</Button>
	)
}
