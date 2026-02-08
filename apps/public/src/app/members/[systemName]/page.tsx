import { getMediaUrl } from "@mpga/types";
import { ClubDetailCard, GolfCourseCard, H1, H2, OfficersCard } from "@mpga/ui";
import { notFound } from "next/navigation";

import {
  getClubBySystemName,
  getClubMembershipInfo,
  getClubOfficers,
} from "@/lib/queries/clubs";
import { getCurrentSeason } from "@/lib/season";

type Params = Promise<{ systemName: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { systemName } = await params;
  const club = await getClubBySystemName(systemName);

  if (!club) {
    return {
      title: "Club Not Found | MPGA",
    };
  }

  return {
    title: `${club.name} | MPGA`,
    description: `View details for ${club.name}, an MPGA member club.`,
  };
}

export default async function ClubDetailPage({ params }: { params: Params }) {
  const { systemName } = await params;
  const club = await getClubBySystemName(systemName);

  if (!club) {
    notFound();
  }

  const currentYear = getCurrentSeason();
  const [officers, membershipInfo] = await Promise.all([
    getClubOfficers(club.id),
    getClubMembershipInfo(club.id, currentYear),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <H1 className="mb-8">{club.name}</H1>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <ClubDetailCard
          website={club.website}
          notes={club.notes}
          size={club.size}
          lastMemberYear={membershipInfo.lastMemberYear}
          currentYearPaymentDate={membershipInfo.currentYearPaymentDate}
        />

        {club.golfCourse ? (
          <GolfCourseCard
            name={club.golfCourse.name}
            address={club.golfCourse.address}
            city={club.golfCourse.city}
            state={club.golfCourse.state}
            zip={club.golfCourse.zip}
            websiteUrl={club.golfCourse.websiteUrl}
            email={club.golfCourse.email}
            phone={club.golfCourse.phone}
            notes={club.golfCourse.notes}
            logoUrl={getMediaUrl(club.golfCourse.logo)}
          />
        ) : (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <H2 className="mb-4 text-lg">Golf Course</H2>
            <p className="text-sm text-gray-500">No golf course assigned.</p>
          </div>
        )}

        <OfficersCard officers={officers} />
      </div>
    </main>
  );
}
