import {
  HeroCarousel,
  FeatureCardsSection,
  AboutSection,
  LatestNewsSection,
  type HeroSlideProps,
} from "@mpga/ui";

import { getLatestAnnouncements } from "@/lib/queries/announcements";
import { getFeatureCards, getAboutContent } from "@/lib/queries/content";
import {
  get2026Tournaments,
  formatTournamentDates,
} from "@/lib/queries/tournaments";

export default async function HomePage() {
  const [tournaments, featureCards, aboutContent, announcements] =
    await Promise.all([
      get2026Tournaments(),
      getFeatureCards(),
      getAboutContent(),
      getLatestAnnouncements(),
    ]);

  // Build slides array: logo slide first, then tournament slides
  const slides: HeroSlideProps[] = [
    {
      type: "logo",
      imageUrl: "/images/mpga-logo.png",
    },
    ...tournaments
      .filter((t) => t.systemName) // Only include tournaments with systemName (has matching image)
      .map((t) => ({
        type: "tournament" as const,
        imageUrl: `/images/${t.systemName}.jpg`,
        title: t.tournamentName,
        subtitle:
          t.instanceName !== t.tournamentName ? t.instanceName : undefined,
        dates: formatTournamentDates(t.startDate, t.rounds),
        venue: `${t.venueName}, ${t.venueCity}`,
        ctaUrl: `/tournaments/${t.systemName}/2026`,
      })),
  ];

  return (
    <main>
      <section className="py-8">
        <HeroCarousel slides={slides} />
      </section>
      {aboutContent && (
        <AboutSection
          title={aboutContent.title}
          content={aboutContent.content}
        />
      )}
      <FeatureCardsSection cards={featureCards} />
      <LatestNewsSection announcements={announcements} />
    </main>
  );
}
