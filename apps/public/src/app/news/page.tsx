import { NewsList } from "@mpga/ui";
import type { Metadata } from "next";

import { getAllAnnouncements } from "@/lib/queries/announcements";

export const metadata: Metadata = {
  title: "News",
  description: "Latest news and announcements from the MPGA.",
};

export default async function NewsPage() {
  const announcements = await getAllAnnouncements();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold font-heading text-primary-900">
        News and Announcements
      </h1>
      <NewsList announcements={announcements} />
    </main>
  );
}
