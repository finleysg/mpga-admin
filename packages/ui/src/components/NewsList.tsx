"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"

import { AnnouncementCard, type AnnouncementCardProps } from "./AnnouncementCard"
import { Button } from "./ui/button"

const PAGE_SIZE = 10

export interface NewsListProps {
	announcements: AnnouncementCardProps[]
}

export function NewsList({ announcements }: NewsListProps) {
	const [currentPage, setCurrentPage] = React.useState(1)

	const totalPages = React.useMemo(
		() => Math.ceil(announcements.length / PAGE_SIZE),
		[announcements.length],
	)

	const paginatedAnnouncements = React.useMemo(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE
		return announcements.slice(startIndex, startIndex + PAGE_SIZE)
	}, [announcements, currentPage])

	if (announcements.length === 0) {
		return <p className="text-sm text-gray-500">No announcements to display.</p>
	}

	return (
		<div className="space-y-6">
			{paginatedAnnouncements.map((announcement) => (
				<AnnouncementCard key={announcement.id} {...announcement} truncate={false} />
			))}

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => prev - 1)}
						disabled={currentPage === 1}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm text-gray-600">
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => prev + 1)}
						disabled={currentPage === totalPages}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	)
}
