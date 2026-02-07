"use client";

import * as React from "react";

export interface MatchPlayResultRow {
  id: number;
  groupName: string;
  matchDate: string;
  homeClubName: string;
  homeTeamScore: string;
  awayClubName: string;
  awayTeamScore: string;
  forfeit: number;
  notes: string | null;
}

export interface MatchPlayResultsTableProps {
  results: MatchPlayResultRow[];
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MatchPlayResultsTable({ results }: MatchPlayResultsTableProps) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, MatchPlayResultRow[]>();
    for (const result of results) {
      const group = map.get(result.groupName);
      if (group) {
        group.push(result);
      } else {
        map.set(result.groupName, [result]);
      }
    }
    return map;
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">
          No results have been posted yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([groupName, groupResults]) => (
        <div key={groupName}>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            {groupName}
          </h3>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-900"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-900"
                  >
                    Home
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
                  >
                    Score
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-900"
                  >
                    Away
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
                  >
                    Score
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
                  >
                    Forfeit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {groupResults.map((result) => {
                  const homeScore = parseFloat(result.homeTeamScore);
                  const awayScore = parseFloat(result.awayTeamScore);
                  const homeWins = homeScore > awayScore;
                  const awayWins = awayScore > homeScore;

                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDate(result.matchDate)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-sm ${homeWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
                      >
                        {result.homeClubName}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-center text-sm ${homeWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
                      >
                        {result.homeTeamScore}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-sm ${awayWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
                      >
                        {result.awayClubName}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-center text-sm ${awayWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
                      >
                        {result.awayTeamScore}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                        {result.forfeit === 1 && (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            Forfeit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
