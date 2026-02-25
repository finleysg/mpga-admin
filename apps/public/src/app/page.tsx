import { HeroSlide, FeatureCardsSection, AboutSection, LatestNewsSection } from "@mpga/ui"

import { getLatestAnnouncements } from "@/lib/queries/announcements"
import { getFeatureCards, getAboutContent } from "@/lib/queries/content"

export const dynamic = "force-dynamic"

export default async function HomePage() {
	const [featureCards, aboutContent, announcements] = await Promise.all([
		getFeatureCards(),
		getAboutContent(),
		getLatestAnnouncements(),
	])

	return (
		<main>
			<section className="mx-auto max-w-6xl px-4 py-8 md:max-w-4xl">
				<HeroSlide type="logo" imageUrl="/images/mpga-logo.png" priority />
			</section>
			{aboutContent && <AboutSection title={aboutContent.title} content={aboutContent.content} />}
			<FeatureCardsSection cards={featureCards} />
			<LatestNewsSection announcements={announcements} />
		</main>
	)
}
