"use client";

export interface MatchPlayTeamRow {
  id: number;
  clubName: string;
  groupName: string;
  isSenior: boolean;
}

export interface MatchPlayTeamsTableProps {
  teams: MatchPlayTeamRow[];
  year: number;
}

export function MatchPlayTeamsTable({ teams, year }: MatchPlayTeamsTableProps) {
  if (teams.length === 0) {
    return (
      <p className="text-gray-600">
        No teams have been assigned for {year} yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-primary-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-900"
            >
              Club
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-900"
            >
              Group
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-900"
            >
              Division
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {teams.map((team) => (
            <tr key={team.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {team.clubName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {team.groupName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {team.isSenior ? "Senior" : "Regular"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
