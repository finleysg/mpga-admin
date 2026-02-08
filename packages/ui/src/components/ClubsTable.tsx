"use client"

import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ExternalLink,
	Search,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Button } from "./ui/button"
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
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						placeholder="Search clubs..."
						value={searchTerm}
						onChange={handleSearchChange}
						className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-64"
					/>
				</div>
				<div className="flex items-center gap-4">
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
										{club.isMember && (
											<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
												Member
											</span>
										)}
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
