import { Calendar, MapPin, ArrowRight, Trophy, History } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface TournamentCardProps {
  name: string;
  description: string;
  dates: string;
  location: string;
  logoUrl?: string;
  href: string;
  historyHref?: string;
}

export function TournamentCard({
  name,
  description,
  dates,
  location,
  logoUrl,
  href,
  historyHref,
}: TournamentCardProps) {
  return (
    <div className="flex flex-col rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} venue logo`}
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          ) : (
            <Trophy className="h-8 w-8 text-gray-400" />
          )}
        </div>
        <h3 className="font-heading text-xl font-bold text-gray-900">{name}</h3>
      </div>
      <p className="mb-4 flex-1 line-clamp-3 text-gray-600">{description}</p>
      {historyHref && (
        <Link
          href={historyHref}
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <History className="h-4 w-4" />
          View History
        </Link>
      )}
      <div className="mb-4 space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{dates}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-secondary-600 hover:text-secondary-700"
      >
        View Details
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
