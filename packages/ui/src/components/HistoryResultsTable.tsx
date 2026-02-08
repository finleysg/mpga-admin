"use client"

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import * as React from "react"

import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export interface HistoryResult {
	id: number
	year: number
	location: string
	winner: string
	winnerClub: string
	coWinner?: string | null
	coWinnerClub?: string | null
	division: string
	score: string
	isMatch: boolean
	isNet: boolean
}

export interface HistoryResultsTableProps {
	results: HistoryResult[]
}

type PageSize = 10 | 25 | 50 | "all"
type SortOrder = "asc" | "desc"

function formatChampion(result: HistoryResult): string {
	const primary = `${result.winner} (${result.winnerClub})`
	if (result.coWinner) {
		return `${primary} & ${result.coWinner} (${result.coWinnerClub})`
	}
	return primary
}

function formatScore(result: HistoryResult): string {
	if (result.isMatch) {
		return result.score
	}
	return result.isNet ? `${result.score} (Net)` : result.score
}

export function HistoryResultsTable({ results }: HistoryResultsTableProps) {
	const [currentPage, setCurrentPage] = React.useState(1)
	const [pageSize, setPageSize] = React.useState<PageSize>(10)
	const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")

	const sortedResults = React.useMemo(() => {
		return [...results].sort((a, b) => {
			return sortOrder === "desc" ? b.year - a.year : a.year - b.year
		})
	}, [results, sortOrder])

	const totalPages = React.useMemo(() => {
		if (pageSize === "all") return 1
		return Math.ceil(results.length / pageSize)
	}, [results.length, pageSize])

	const paginatedResults = React.useMemo(() => {
		if (pageSize === "all") return sortedResults
		const startIndex = (currentPage - 1) * pageSize
		return sortedResults.slice(startIndex, startIndex + pageSize)
	}, [sortedResults, currentPage, pageSize])

	const handlePageSizeChange = (newSize: PageSize) => {
		setPageSize(newSize)
		setCurrentPage(1)
	}

	const toggleSort = () => {
		setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
		setCurrentPage(1)
	}

	if (results.length === 0) {
		return (
			<div className="rounded-lg bg-white p-6 shadow-sm">
				<p className="text-sm text-gray-500">No tournament history available.</p>
			</div>
		)
	}

	const showPagination = pageSize !== "all" && totalPages > 1

	return (
		<div className="space-y-4">
			{/* Controls row */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<label htmlFor="pageSize" className="text-sm text-gray-600">
						Show:
					</label>
					<select
						id="pageSize"
						value={pageSize}
						onChange={(e) =>
							handlePageSizeChange(
								e.target.value === "all" ? "all" : (Number(e.target.value) as 10 | 25 | 50),
							)
						}
						className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value="all">All</option>
					</select>
				</div>
				<p className="text-sm text-gray-600">
					{results.length} {results.length === 1 ? "result" : "results"}
				</p>
			</div>

			{/* Table */}
			<div className="rounded-lg bg-white shadow-sm">
				<Table className="min-w-full divide-y divide-gray-200">
					<TableHeader className="bg-primary-50">
						<TableRow className="hover:bg-transparent">
							<TableHead
								scope="col"
								onClick={toggleSort}
								className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900 transition-colors hover:bg-primary-100"
							>
								<span className="flex items-center gap-1">
									Year
									{sortOrder === "desc" ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronUp className="h-4 w-4" />
									)}
								</span>
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Division
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Location
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Champion
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Score
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody className="divide-y divide-gray-100 bg-white">
						{paginatedResults.map((result) => (
							<TableRow key={result.id} className="hover:bg-gray-50">
								<TableCell className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
									{result.year}
								</TableCell>
								<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
									{result.division}
								</TableCell>
								<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
									{result.location}
								</TableCell>
								<TableCell className="px-4 py-3 text-sm text-gray-700">
									{formatChampion(result)}
								</TableCell>
								<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
									{formatScore(result)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{showPagination && (
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
