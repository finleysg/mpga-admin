import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface AnnouncementCardProps {
  id: number;
  title: string;
  text: string;
  createDate: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AnnouncementCard({
  id,
  title,
  text,
  createDate,
}: AnnouncementCardProps) {
  return (
    <div className="flex flex-col rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="h-4 w-4" />
        <span>{formatDate(createDate)}</span>
      </div>
      <h3 className="font-heading mb-3 text-xl font-bold text-gray-900">
        {title}
      </h3>
      <p className="mb-4 flex-1 line-clamp-3 text-gray-600">{text}</p>
      <Link
        href={`/news/${id}`}
        className="inline-flex items-center gap-1 text-secondary-600 hover:text-secondary-700"
      >
        Read More
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
