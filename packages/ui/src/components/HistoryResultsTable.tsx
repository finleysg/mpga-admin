"use client"

import { ArrowDownUp, ChevronDown, ChevronUp } from "lucide-react"
import * as React from "react"

import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { PageSizeSelect } from "./ui/page-size-select"
import { Pagination } from "./ui/pagination"
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

export function formatChampion(result: HistoryResult): string {
	const primary = `${result.winner} (${result.winnerClub})`
	if (result.coWinner) {
		return `${primary} & ${result.coWinner} (${result.coWinnerClub})`
	}
	return primary
}

export function formatScore(result: HistoryResult): string {
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
					<PageSizeSelect
						value={String(pageSize)}
						onChange={(v) =>
							handlePageSizeChange(v === "all" ? "all" : (Number(v) as 10 | 25 | 50))
						}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={toggleSort}
						className="md:hidden"
						aria-label={`Sort by year ${sortOrder === "desc" ? "ascending" : "descending"}`}
					>
						<ArrowDownUp className="mr-1 h-4 w-4" />
						{sortOrder === "desc" ? "Newest" : "Oldest"}
					</Button>
				</div>
				<p className="text-sm text-gray-600">
					{results.length} {results.length === 1 ? "result" : "results"}
				</p>
			</div>

			{/* Table (desktop) */}
			<div className="hidden rounded-lg bg-white shadow-sm md:block">
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

			{/* Cards (mobile) */}
			<div className="space-y-2 md:hidden">
				{paginatedResults.map((result) => (
					<div
						key={result.id}
						className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-sm font-bold text-primary-900">{result.year}</span>
								<Badge variant="outline" className="px-1.5 py-0 text-xs">
									{result.division}
								</Badge>
							</div>
							<span className="text-sm font-medium text-gray-700">{formatScore(result)}</span>
						</div>
						<p className="mt-1 text-sm text-gray-900">{formatChampion(result)}</p>
						<p className="mt-0.5 text-xs text-gray-500">{result.location}</p>
					</div>
				))}
			</div>

			{/* Pagination */}
			{showPagination && (
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPreviousPage={() => setCurrentPage((prev) => prev - 1)}
					onNextPage={() => setCurrentPage((prev) => prev + 1)}
				/>
			)}
		</div>
	)
}
