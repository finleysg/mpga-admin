import type { HeroSlideProps } from "@mpga/ui"

import type { TournamentForYear } from "./queries/tournaments"
import { formatTournamentDates } from "./queries/tournaments"

const logoSlide: HeroSlideProps = {
	type: "logo",
	imageUrl: "/images/mpga-logo.png",
}

export function buildHeroSlides(
	tournaments: TournamentForYear[],
	year: number,
	today: string,
): HeroSlideProps[] {
	const withSystemName = tournaments.filter((t) => t.systemName)
	const tournamentSlides = withSystemName.map((t) => ({
		type: "tournament" as const,
		imageUrl: `/images/${t.systemName}.jpg`,
		title: t.tournamentName,
		subtitle: t.instanceName !== t.tournamentName ? t.instanceName : undefined,
		dates: formatTournamentDates(t.startDate, t.rounds),
		venue: `${t.venueName}, ${t.venueCity}`,
		ctaUrl: `/tournaments/${t.systemName}/${year}`,
	}))

	// Find the next upcoming tournament to display first
	const nextUpcomingIndex = withSystemName.findIndex((t) => t.startDate >= today)

	if (nextUpcomingIndex >= 0) {
		// Put next upcoming event first, then remaining tournaments, then logo
		return [
			...tournamentSlides.slice(nextUpcomingIndex),
			logoSlide,
			...tournamentSlides.slice(0, nextUpcomingIndex),
		]
	}

	// No upcoming events — logo first
	return [logoSlide, ...tournamentSlides]
}
