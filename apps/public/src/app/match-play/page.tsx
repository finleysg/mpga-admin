import { Markdown, MatchPlaySignUp, MatchPlayTeamsTable } from "@mpga/ui";

import { getMatchPlayContent } from "@/lib/queries/content";
import { getTeamsForYear } from "@/lib/queries/match-play";

export default async function MatchPlayPage() {
  const currentYear = new Date().getFullYear();
  const deadlineStr = process.env.MATCH_PLAY_DEADLINE;

  let showSignUp = false;
  let formattedDeadline = "";

  if (deadlineStr) {
    const deadline = new Date(`${deadlineStr}T23:59:59`);
    if (!isNaN(deadline.getTime()) && new Date() <= deadline) {
      showSignUp = true;
      formattedDeadline = deadline.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  const [content, teams] = await Promise.all([
    getMatchPlayContent(),
    showSignUp ? Promise.resolve([]) : getTeamsForYear(currentYear),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 font-heading text-3xl font-bold text-primary-900">
        {content?.title}
      </h1>
      {content && <Markdown content={content.content} className="mb-8" />}
      {showSignUp ? (
        <MatchPlaySignUp year={currentYear} deadline={formattedDeadline} />
      ) : (
        <MatchPlayTeamsTable teams={teams} year={currentYear} />
      )}
    </main>
  );
}
