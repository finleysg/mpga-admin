import Link from "next/link";

import {
  AnnouncementCard,
  type AnnouncementCardProps,
} from "./AnnouncementCard";
import { Button } from "./ui/button";

export interface LatestNewsSectionProps {
  announcements: AnnouncementCardProps[];
}

export function LatestNewsSection({ announcements }: LatestNewsSectionProps) {
  if (announcements.length === 0) {
    return null;
  }

  return (
    <section className="bg-secondary-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-heading mb-10 text-center text-3xl font-bold text-gray-900">
          Latest News
        </h2>
        <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} {...announcement} />
          ))}
        </div>
        <div className="text-center">
          <Link href="/news">
            <Button className="bg-secondary-600 hover:bg-secondary-700">
              View All News
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
