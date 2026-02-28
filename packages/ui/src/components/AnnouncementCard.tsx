import { Calendar, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Card, CardContent } from "./ui/card"
import { H3 } from "./ui/heading"

export interface AnnouncementCardProps {
	id: number
	title: string
	text: string
	createDate: string
	externalUrl?: string
	externalName?: string
	truncate?: boolean
}

function formatDate(dateString: string): string {
	const date = new Date(dateString)
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	})
}

export function AnnouncementCard({
	id,
	title,
	text,
	createDate,
	externalUrl,
	externalName,
	truncate = true,
}: AnnouncementCardProps) {
	return (
		<Card id={`announcement-${id}`}>
			<CardContent>
				<div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
					<Calendar className="h-4 w-4" />
					<span>{formatDate(createDate)}</span>
				</div>
				<H3 className="mb-3 font-bold">{title}</H3>
				<p className={`mb-4 flex-1 text-gray-600${truncate ? " line-clamp-3" : ""}`}>{text}</p>
				{externalUrl && (
					<a
						href={externalUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="mb-4 inline-flex items-center gap-1 text-gray-400 hover:text-gray-500"
					>
						{externalName || externalUrl}
						<ExternalLink className="h-4 w-4" />
					</a>
				)}
				{truncate && (
					<Link
						href={`/news#announcement-${id}`}
						className="flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700"
					>
						Read More
						<ArrowRight className="h-4 w-4" />
					</Link>
				)}
			</CardContent>
		</Card>
	)
}
