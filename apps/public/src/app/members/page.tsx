import { ClubsTable, Markdown } from "@mpga/ui";

import {
  getMembersContent,
  getClubsWithMembershipStatus,
} from "@/lib/queries/clubs";

export const metadata = {
  title: "Member Clubs | MPGA",
  description: "View MPGA member clubs and their membership status.",
};

export default async function MembersPage() {
  const currentYear = new Date().getFullYear();
  const [content, clubs] = await Promise.all([
    getMembersContent(),
    getClubsWithMembershipStatus(currentYear),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Member Clubs</h1>

      {content && (
        <div className="mb-8">
          <Markdown content={content.content} />
        </div>
      )}

      <ClubsTable clubs={clubs} />
    </main>
  );
}
