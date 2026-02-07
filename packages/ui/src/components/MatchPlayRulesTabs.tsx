"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

import { Button } from "./ui/button";
import { Markdown } from "./Markdown";

export interface MatchPlayRulesTabsProps {
  matchPlayRules: { title: string; content: string } | null;
  seniorRules: { title: string; content: string } | null;
}

const tabs = [
  { key: "match-play", label: "Match Play Rules" },
  { key: "senior", label: "Senior Match Play Rules" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function MatchPlayRulesTabs({
  matchPlayRules,
  seniorRules,
}: MatchPlayRulesTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("match-play");

  const activeContent =
    activeTab === "match-play" ? matchPlayRules : seniorRules;

  return (
    <>
      <style>{`
        @media print {
          header, footer { display: none !important; }
          nav { display: none !important; }
          .rules-tab-bar { display: none !important; }
          .rules-print-button { display: none !important; }
        }
      `}</style>

      <div className="rules-tab-bar mb-6 flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="rules-print-button absolute right-0 top-0"
          onClick={() => window.print()}
        >
          <Printer className="mr-1.5 h-4 w-4" />
          Print
        </Button>

        {activeContent ? (
          <Markdown content={activeContent.content} className="pr-24" />
        ) : (
          <p className="text-sm text-gray-400">No rules content available.</p>
        )}
      </div>
    </>
  );
}
