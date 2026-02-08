import { Calendar, ExternalLink } from "lucide-react";

import { H2 } from "./ui/heading";

export interface TournamentLinkItem {
  id: number;
  linkType: string;
  url: string;
  title: string;
}

export interface RegistrationCardProps {
  registrationStart?: string | null;
  registrationEnd?: string | null;
  links: TournamentLinkItem[];
}

function formatDateTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RegistrationCard({
  registrationStart,
  registrationEnd,
  links,
}: RegistrationCardProps) {
  const hasRegistrationDates = registrationStart || registrationEnd;
  const hasLinks = links.length > 0;

  if (!hasRegistrationDates && !hasLinks) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <H2 className="mb-4 text-lg">Registration</H2>

      {hasRegistrationDates && (
        <div className="mb-4 space-y-3">
          {registrationStart && (
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-500">Opens</div>
                <div className="text-gray-900">
                  {formatDateTime(registrationStart)}
                </div>
              </div>
            </div>
          )}
          {registrationEnd && (
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-500">Closes</div>
                <div className="text-gray-900">
                  {formatDateTime(registrationEnd)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {hasLinks && (
        <div className="space-y-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-700"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span>{link.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
