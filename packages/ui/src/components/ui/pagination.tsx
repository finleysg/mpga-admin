import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "./button"

export interface PaginationProps {
	currentPage: number
	totalPages: number
	onPreviousPage: () => void
	onNextPage: () => void
}

export function Pagination({
	currentPage,
	totalPages,
	onPreviousPage,
	onNextPage,
}: PaginationProps) {
	return (
		<div className="flex items-center justify-center gap-4">
			<Button variant="outline" size="sm" onClick={onPreviousPage} disabled={currentPage === 1}>
				<ChevronLeft className="h-4 w-4" />
			</Button>
			<span className="text-sm text-gray-600">
				Page {currentPage} of {totalPages}
			</span>
			<Button
				variant="outline"
				size="sm"
				onClick={onNextPage}
				disabled={currentPage === totalPages}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	)
}
