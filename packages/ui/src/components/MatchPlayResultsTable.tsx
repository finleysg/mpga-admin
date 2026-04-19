"use client"

import * as React from "react"

import { Badge } from "./ui/badge"
import { PageSizeSelect } from "./ui/page-size-select"
import { Pagination } from "./ui/pagination"
import { SearchInput } from "./ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export interface MatchPlayResultRow {
	id: number
	groupName: string
	matchDate: string
	homeClubName: string
	homeTeamScore: string
	awayClubName: string
	awayTeamScore: string
	forfeit: boolean
	notes: string | null
}

export interface MatchPlayResultsTableProps {
	results: MatchPlayResultRow[]
}

type PageSize = 10 | 25 | 50 | "all"

const ALL_GROUPS = "__all__"

function formatDate(dateStr: string): string {
	const [year, month, day] = dateStr.split("-").map(Number)
	const date = new Date(year!, month! - 1, day)
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function MatchPlayResultsTable({ results }: MatchPlayResultsTableProps) {
	const [currentPage, setCurrentPage] = React.useState(1)
	const [pageSize, setPageSize] = React.useState<PageSize>(25)
	const [groupFilter, setGroupFilter] = React.useState<string>(ALL_GROUPS)
	const [searchTerm, setSearchTerm] = React.useState("")

	const groupNames = React.useMemo(() => {
		const names = new Set<string>()
		for (const result of results) names.add(result.groupName)
		return Array.from(names).sort((a, b) => a.localeCompare(b))
	}, [results])

	const filteredResults = React.useMemo(() => {
		const term = searchTerm.trim().toLowerCase()
		return results.filter((result) => {
			if (groupFilter !== ALL_GROUPS && result.groupName !== groupFilter) return false
			if (term) {
				const home = result.homeClubName.toLowerCase()
				const away = result.awayClubName.toLowerCase()
				if (!home.includes(term) && !away.includes(term)) return false
			}
			return true
		})
	}, [results, groupFilter, searchTerm])

	const sortedResults = React.useMemo(() => {
		return [...filteredResults].sort((a, b) => {
			const groupCompare = a.groupName.localeCompare(b.groupName)
			if (groupCompare !== 0) return groupCompare
			const dateCompare = a.matchDate.localeCompare(b.matchDate)
			if (dateCompare !== 0) return dateCompare
			return a.homeClubName.localeCompare(b.homeClubName)
		})
	}, [filteredResults])

	const totalPages = React.useMemo(() => {
		if (pageSize === "all") return 1
		return Math.max(1, Math.ceil(sortedResults.length / pageSize))
	}, [sortedResults.length, pageSize])

	const paginatedResults = React.useMemo(() => {
		if (pageSize === "all") return sortedResults
		const startIndex = (currentPage - 1) * pageSize
		return sortedResults.slice(startIndex, startIndex + pageSize)
	}, [sortedResults, currentPage, pageSize])

	const handlePageSizeChange = (newSize: PageSize) => {
		setPageSize(newSize)
		setCurrentPage(1)
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		setCurrentPage(1)
	}

	const handleGroupChange = (value: string) => {
		setGroupFilter(value)
		setCurrentPage(1)
	}

	const showPagination = pageSize !== "all" && totalPages > 1
	const showGroupColumn = groupFilter === ALL_GROUPS
	const isFiltered = groupFilter !== ALL_GROUPS || searchTerm.trim().length > 0

	if (results.length === 0) {
		return (
			<div className="rounded-lg bg-white p-6 shadow-sm">
				<p className="text-sm text-gray-500">No results have been posted yet.</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Controls row */}
			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<SearchInput
						placeholder="Search club..."
						value={searchTerm}
						onChange={handleSearchChange}
					/>
					<Select value={groupFilter} onValueChange={handleGroupChange}>
						<SelectTrigger className="h-10 w-full sm:w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_GROUPS}>All groups</SelectItem>
							{groupNames.map((name) => (
								<SelectItem key={name} value={name}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-4">
					<PageSizeSelect
						value={String(pageSize)}
						onChange={(v) =>
							handlePageSizeChange(v === "all" ? "all" : (Number(v) as 10 | 25 | 50))
						}
					/>
					<p className="text-sm text-gray-600">
						{sortedResults.length} {sortedResults.length === 1 ? "match" : "matches"}
						{isFiltered && ` (filtered)`}
					</p>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-lg bg-white shadow-sm">
				<Table className="min-w-full divide-y divide-gray-200">
					<TableHeader className="bg-primary-50">
						<TableRow className="hover:bg-transparent">
							{showGroupColumn && (
								<TableHead
									scope="col"
									className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
								>
									Group
								</TableHead>
							)}
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Date
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Home
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Score
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Away
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Score
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Forfeit
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody className="divide-y divide-gray-100 bg-white">
						{paginatedResults.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell
									colSpan={showGroupColumn ? 7 : 6}
									className="px-4 py-8 text-center text-sm text-gray-500"
								>
									No matches found
								</TableCell>
							</TableRow>
						) : (
							paginatedResults.map((result) => {
								const homeScore = parseFloat(result.homeTeamScore)
								const awayScore = parseFloat(result.awayTeamScore)
								const homeWins = homeScore > awayScore
								const awayWins = awayScore > homeScore

								return (
									<TableRow key={result.id} className="hover:bg-gray-50">
										{showGroupColumn && (
											<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
												{result.groupName}
											</TableCell>
										)}
										<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
											{formatDate(result.matchDate)}
										</TableCell>
										<TableCell
											className={`whitespace-nowrap px-4 py-3 text-sm ${homeWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
										>
											{result.homeClubName}
										</TableCell>
										<TableCell
											className={`whitespace-nowrap px-4 py-3 text-center text-sm ${homeWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
										>
											{result.homeTeamScore}
										</TableCell>
										<TableCell
											className={`whitespace-nowrap px-4 py-3 text-sm ${awayWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
										>
											{result.awayClubName}
										</TableCell>
										<TableCell
											className={`whitespace-nowrap px-4 py-3 text-center text-sm ${awayWins ? "font-semibold text-primary-900" : "text-gray-700"}`}
										>
											{result.awayTeamScore}
										</TableCell>
										<TableCell className="whitespace-nowrap px-4 py-3 text-center text-sm">
											{result.forfeit && <Badge variant="destructive">Forfeit</Badge>}
										</TableCell>
									</TableRow>
								)
							})
						)}
					</TableBody>
				</Table>
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
