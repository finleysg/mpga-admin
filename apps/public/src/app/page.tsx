import { HeroCarousel, FeatureCardsSection, AboutSection, LatestNewsSection } from "@mpga/ui"

import { buildHeroSlides } from "@/lib/hero-slides"
import { getLatestAnnouncements } from "@/lib/queries/announcements"
import { getFeatureCards, getAboutContent } from "@/lib/queries/content"
import { getTournamentsForYear } from "@/lib/queries/tournaments"

export const dynamic = "force-dynamic"

export default async function HomePage() {
	const year = new Date().getFullYear()
	const [tournaments, featureCards, aboutContent, announcements] = await Promise.all([
		getTournamentsForYear(year),
		getFeatureCards(),
		getAboutContent(),
		getLatestAnnouncements(),
	])

	const today = new Date().toISOString().split("T")[0]!
	const slides = buildHeroSlides(tournaments, year, today)

	return (
		<main>
			<section className="py-8">
				<HeroCarousel slides={slides} />
			</section>
			{aboutContent && <AboutSection title={aboutContent.title} content={aboutContent.content} />}
			<FeatureCardsSection cards={featureCards} />
			<LatestNewsSection announcements={announcements} />
		</main>
	)
}
