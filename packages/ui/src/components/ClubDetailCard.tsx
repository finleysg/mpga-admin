import { Calendar, Globe, Users } from "lucide-react";

import { Markdown } from "./Markdown";

export interface ClubDetailCardProps {
  website?: string | null;
  notes?: string | null;
  size?: number | null;
  lastMemberYear?: number | null;
  currentYearPaymentDate?: string | null;
}

function formatDate(dateString: string): string {
  const parts = dateString.split("-").map(Number);
  const date = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ClubDetailCard({
  website,
  notes,
  size,
  lastMemberYear,
  currentYearPaymentDate,
}: ClubDetailCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold font-heading text-primary-900">
        Club Overview
      </h2>

      <div className="space-y-3">
        {size && (
          <div className="flex items-center gap-3 text-gray-600">
            <Users className="h-5 w-5 shrink-0 text-gray-400" />
            <span className="text-sm">{size} members</span>
          </div>
        )}

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-secondary-600 hover:text-secondary-700"
          >
            <Globe className="h-5 w-5 shrink-0 text-gray-400" />
            <span className="text-sm">Club Website</span>
          </a>
        )}

        {lastMemberYear && (
          <div className="flex items-start gap-3 text-gray-600">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div className="text-sm">
              <p>Most recent membership: {lastMemberYear}</p>
              {currentYearPaymentDate && (
                <p className="text-green-600">
                  Joined {formatDate(currentYearPaymentDate)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {notes && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            About the Club
          </h3>
          <Markdown content={notes} />
        </div>
      )}
    </div>
  );
}
