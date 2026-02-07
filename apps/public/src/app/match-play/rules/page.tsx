import { MatchPlayRulesTabs } from "@mpga/ui";
import type { Metadata } from "next";

import {
  getMatchPlayRules,
  getSeniorMatchPlayRules,
} from "@/lib/queries/content";

export const metadata: Metadata = {
  title: "Match Play Rules",
  description: "Rules for MPGA match play and senior match play competitions.",
};

export default async function MatchPlayRulesPage() {
  const [matchPlayRules, seniorRules] = await Promise.all([
    getMatchPlayRules(),
    getSeniorMatchPlayRules(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold font-heading text-primary-900">
        Match Play Rules
      </h1>
      <MatchPlayRulesTabs
        matchPlayRules={matchPlayRules}
        seniorRules={seniorRules}
      />
    </main>
  );
}
