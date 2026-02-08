import Link from "next/link"

import { AnnouncementCard, type AnnouncementCardProps } from "./AnnouncementCard"
import { Button } from "./ui/button"
import { H2 } from "./ui/heading"

export interface LatestNewsSectionProps {
	announcements: AnnouncementCardProps[]
}

export function LatestNewsSection({ announcements }: LatestNewsSectionProps) {
	if (announcements.length === 0) {
		return null
	}

	return (
		<section className="bg-secondary-50 py-16">
			<div className="mx-auto max-w-6xl px-4">
				<H2 className="mb-10 text-center text-3xl">Latest News</H2>
				<div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{announcements.map((announcement) => (
						<AnnouncementCard key={announcement.id} {...announcement} />
					))}
				</div>
				<div className="text-center">
					<Button asChild className="bg-secondary-600 hover:bg-secondary-700">
						<Link href="/news">View All News</Link>
					</Button>
				</div>
			</div>
		</section>
	)
}
