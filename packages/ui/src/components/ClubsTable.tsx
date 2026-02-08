"use client"

import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Badge } from "./ui/badge"
import { PageSizeSelect } from "./ui/page-size-select"
import { Pagination } from "./ui/pagination"
import { SearchInput } from "./ui/search-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export interface ClubRow {
	id: number
	name: string
	website: string
	systemName: string | null
	isMember: boolean
}

export interface ClubsTableProps {
	clubs: ClubRow[]
}

type PageSize = 10 | 25 | 50 | "all"
type SortOrder = "asc" | "desc"

export function ClubsTable({ clubs }: ClubsTableProps) {
	const [currentPage, setCurrentPage] = React.useState(1)
	const [pageSize, setPageSize] = React.useState<PageSize>(25)
	const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")
	const [searchTerm, setSearchTerm] = React.useState("")

	const filteredClubs = React.useMemo(() => {
		if (!searchTerm.trim()) return clubs
		const term = searchTerm.toLowerCase()
		return clubs.filter((club) => club.name.toLowerCase().includes(term))
	}, [clubs, searchTerm])

	const sortedClubs = React.useMemo(() => {
		return [...filteredClubs].sort((a, b) => {
			const comparison = a.name.localeCompare(b.name)
			return sortOrder === "asc" ? comparison : -comparison
		})
	}, [filteredClubs, sortOrder])

	const totalPages = React.useMemo(() => {
		if (pageSize === "all") return 1
		return Math.ceil(sortedClubs.length / pageSize)
	}, [sortedClubs.length, pageSize])

	const paginatedClubs = React.useMemo(() => {
		if (pageSize === "all") return sortedClubs
		const startIndex = (currentPage - 1) * pageSize
		return sortedClubs.slice(startIndex, startIndex + pageSize)
	}, [sortedClubs, currentPage, pageSize])

	const handlePageSizeChange = (newSize: PageSize) => {
		setPageSize(newSize)
		setCurrentPage(1)
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		setCurrentPage(1)
	}

	const toggleSort = () => {
		setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
		setCurrentPage(1)
	}

	const showPagination = pageSize !== "all" && totalPages > 1

	return (
		<div className="space-y-4">
			{/* Controls row */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<SearchInput
					placeholder="Search clubs..."
					value={searchTerm}
					onChange={handleSearchChange}
				/>
				<div className="flex items-center gap-4">
					<PageSizeSelect
						value={String(pageSize)}
						onChange={(v) =>
							handlePageSizeChange(v === "all" ? "all" : (Number(v) as 10 | 25 | 50))
						}
					/>
					<p className="text-sm text-gray-600">
						{sortedClubs.length} {sortedClubs.length === 1 ? "club" : "clubs"}
						{searchTerm && ` (filtered)`}
					</p>
				</div>
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
									Club Name
									{sortOrder === "asc" ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</span>
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Status
							</TableHead>
							<TableHead
								scope="col"
								className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-900"
							>
								Website
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody className="divide-y divide-gray-100 bg-white">
						{paginatedClubs.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
									No clubs found
								</TableCell>
							</TableRow>
						) : (
							paginatedClubs.map((club) => (
								<TableRow key={club.id} className="hover:bg-gray-50">
									<TableCell className="px-4 py-3 text-sm">
										{club.systemName ? (
											<Link
												href={`/members/${club.systemName}`}
												className="font-medium text-secondary-600 hover:text-secondary-700 hover:underline"
											>
												{club.name}
											</Link>
										) : (
											<span className="font-medium text-gray-900">{club.name}</span>
										)}
									</TableCell>
									<TableCell className="whitespace-nowrap px-4 py-3 text-sm">
										{club.isMember && <Badge variant="success">Member</Badge>}
									</TableCell>
									<TableCell className="px-4 py-3 text-sm">
										{club.website && (
											<a
												href={club.website}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-secondary-600 hover:text-secondary-700"
											>
												<ExternalLink className="h-4 w-4" />
												<span className="sr-only">Visit website</span>
											</a>
										)}
									</TableCell>
								</TableRow>
							))
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
