import { getMediaUrl } from "@mpga/types";
import { ClubDetailCard, GolfCourseCard, OfficersCard } from "@mpga/ui";
import { notFound } from "next/navigation";

import {
  getClubBySystemName,
  getClubMembershipInfo,
  getClubOfficers,
} from "@/lib/queries/clubs";

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

  const currentYear = new Date().getFullYear();
  const [officers, membershipInfo] = await Promise.all([
    getClubOfficers(club.id),
    getClubMembershipInfo(club.id, currentYear),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold font-heading text-primary-900">
        {club.name}
      </h1>

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
            <h2 className="mb-4 text-lg font-bold font-heading text-primary-900">
              Golf Course
            </h2>
            <p className="text-sm text-gray-500">No golf course assigned.</p>
          </div>
        )}

        <OfficersCard officers={officers} />
      </div>
    </main>
  );
}
