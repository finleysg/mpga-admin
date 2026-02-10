"use client"

import {
	Button,
	Card,
	EmptyState,
	H1,
	PageSizeSelect,
	Pagination,
	SearchInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mpga/ui"
import {
	type Column,
	type ColumnDef,
	type FilterFn,
	type PaginationState,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { type ResultData, listResultsAction } from "./actions"

const formatDate = (dateStr: string) => {
	const d = new Date(dateStr + "T00:00:00")
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const resultGlobalFilterFn: FilterFn<ResultData> = (row, _columnId, filterValue) => {
	const term = (filterValue as string).toLowerCase()
	if (!term) return true

	const r = row.original
	return (
		r.groupName.toLowerCase().includes(term) ||
		r.homeClubName.toLowerCase().includes(term) ||
		r.awayClubName.toLowerCase().includes(term)
	)
}

const columns: ColumnDef<ResultData>[] = [
	{
		accessorKey: "groupName",
		header: "Group",
		cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
	},
	{
		accessorKey: "matchDate",
		header: "Date",
		cell: ({ getValue }) => formatDate(getValue<string>()),
	},
	{
		accessorKey: "homeClubName",
		header: "Home",
	},
	{
		accessorKey: "homeTeamScore",
		header: "H Score",
		enableSorting: false,
	},
	{
		accessorKey: "awayClubName",
		header: "Away",
	},
	{
		accessorKey: "awayTeamScore",
		header: "A Score",
		enableSorting: false,
	},
	{
		accessorKey: "forfeit",
		header: "Forfeit",
		cell: ({ getValue }) => (getValue<boolean>() ? "Yes" : ""),
		enableSorting: false,
	},
]

function SortIcon({ column }: { column: Column<ResultData> }) {
	const sorted = column.getIsSorted()
	if (!sorted) {
		return <ChevronsUpDown className="ml-1 inline h-4 w-4 opacity-50" />
	}
	return sorted === "asc" ? (
		<ChevronUp className="ml-1 inline h-4 w-4" />
	) : (
		<ChevronDown className="ml-1 inline h-4 w-4" />
	)
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)

export default function MatchPlayResultsPage() {
	const router = useRouter()
	const [mounted, setMounted] = useState(false)
	const [results, setResults] = useState<ResultData[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [year, setYear] = useState(currentYear)
	const [globalFilter, setGlobalFilter] = useState("")
	const [sorting, setSorting] = useState<SortingState>([{ id: "groupName", desc: false }])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25,
	})
	const [pageSizeOption, setPageSizeOption] = useState<string>("25")

	useEffect(() => setMounted(true), [])

	useEffect(() => {
		async function fetchResults() {
			setLoading(true)
			try {
				const result = await listResultsAction(year)
				if (result.success && result.data) {
					setResults(result.data)
				} else {
					setError(result.error ?? "Failed to load results")
				}
			} catch (err) {
				console.error("Failed to fetch results:", err)
				setError("Failed to load results")
			} finally {
				setLoading(false)
			}
		}

		fetchResults()
	}, [year])

	const table = useReactTable({
		data: results,
		columns,
		state: {
			sorting,
			globalFilter,
			pagination,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		globalFilterFn: resultGlobalFilterFn,
		autoResetPageIndex: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const handlePageSizeChange = (value: string) => {
		setPageSizeOption(value)
		if (value === "all") {
			table.setPageSize(results.length || 1)
		} else {
			table.setPageSize(Number(value))
		}
		table.setPageIndex(0)
	}

	const filteredCount = table.getFilteredRowModel().rows.length
	const showPagination = pageSizeOption !== "all" && table.getPageCount() > 1

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-6 flex items-center justify-between">
				<H1 variant="secondary">Match Play Results</H1>
				<Button variant="secondary" onClick={() => router.push("/match-play/results/new")}>
					Add Result
				</Button>
			</div>

			{/* Year selector */}
			<div className="mb-4 flex items-center gap-2">
				<span className="text-sm font-medium text-gray-700">Year:</span>
				{mounted ? (
					<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{yearOptions.map((y) => (
								<SelectItem key={y} value={String(y)}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<div className="h-9 w-28 rounded-md border bg-transparent" />
				)}
			</div>

			{loading ? (
				<EmptyState message="Loading results..." />
			) : error ? (
				<EmptyState message={error} />
			) : results.length === 0 ? (
				<EmptyState message={`No results found for ${year}`} />
			) : (
				<div className="space-y-4">
					{/* Controls row */}
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<SearchInput
							variant="secondary"
							placeholder="Search results..."
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
						/>
						<div className="flex items-center gap-4">
							<PageSizeSelect
								value={pageSizeOption}
								onChange={handlePageSizeChange}
								options={[10, 25, 50, 100, "all"]}
							/>
							<p className="text-sm text-gray-600">
								{filteredCount} {filteredCount === 1 ? "result" : "results"}
								{globalFilter && ` (filtered)`}
							</p>
						</div>
					</div>

					{filteredCount === 0 ? (
						<EmptyState message="No results match your search" />
					) : (
						<>
							{/* Table */}
							<Card className="overflow-x-auto p-0">
								<Table className="min-w-full divide-y divide-gray-200">
									<TableHeader className="bg-secondary-50">
										<TableRow className="hover:bg-secondary-50">
											{table.getHeaderGroups().map((headerGroup) =>
												headerGroup.headers.map((header) => (
													<TableHead
														key={header.id}
														className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-900${
															header.column.getCanSort()
																? " cursor-pointer transition-colors hover:bg-secondary-100"
																: ""
														}`}
														onClick={header.column.getToggleSortingHandler()}
													>
														{header.column.getCanSort() ? (
															<span className="flex items-center gap-1">
																{flexRender(header.column.columnDef.header, header.getContext())}
																<SortIcon column={header.column} />
															</span>
														) : (
															flexRender(header.column.columnDef.header, header.getContext())
														)}
													</TableHead>
												)),
											)}
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-gray-100 bg-white">
										{table.getRowModel().rows.map((row) => (
											<TableRow
												key={row.original.id}
												className="cursor-pointer hover:bg-gray-50"
												onClick={() => router.push(`/match-play/results/${row.original.id}`)}
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell key={cell.id} className="px-4 py-3 text-sm">
														{flexRender(cell.column.columnDef.cell, cell.getContext())}
													</TableCell>
												))}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Card>

							{/* Pagination */}
							{showPagination && (
								<Pagination
									currentPage={table.getState().pagination.pageIndex + 1}
									totalPages={table.getPageCount()}
									onPreviousPage={() => table.previousPage()}
									onNextPage={() => table.nextPage()}
								/>
							)}
						</>
					)}
				</div>
			)}
		</div>
	)
}
