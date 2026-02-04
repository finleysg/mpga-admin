export const dynamic = "force-dynamic";

import { HeroCarousel, type HeroSlideProps } from "@mpga/ui";

import {
  get2026Tournaments,
  formatTournamentDates,
} from "@/lib/queries/tournaments";

export default async function HomePage() {
  const tournaments = await get2026Tournaments();

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
    </main>
  );
}
