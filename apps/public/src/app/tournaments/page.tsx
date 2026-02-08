import { getMediaUrl } from "@mpga/types";
import { H1, TournamentCard } from "@mpga/ui";

import {
  getTournamentsForYear,
  formatTournamentDates,
} from "@/lib/queries/tournaments";
import { getCurrentSeason } from "@/lib/season";

export default async function TournamentsPage() {
  const currentYear = getCurrentSeason();
  const tournaments = await getTournamentsForYear(currentYear);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <H1 className="mb-8">{currentYear} Tournament Schedule</H1>
      {tournaments.length === 0 ? (
        <p className="text-gray-600">
          No tournaments scheduled for {currentYear}.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments
            .filter((t) => t.systemName !== null)
            .map((t) => (
              <TournamentCard
                key={t.instanceId}
                name={t.tournamentName}
                description={t.tournamentDescription}
                dates={formatTournamentDates(t.startDate, t.rounds)}
                location={`${t.venueName}, ${t.venueCity}`}
                logoUrl={getMediaUrl(t.venueLogo)}
                href={`/tournaments/${t.systemName}/${currentYear}`}
                historyHref={`/tournaments/${t.systemName}/history`}
              />
            ))}
        </div>
      )}
    </main>
  );
}
