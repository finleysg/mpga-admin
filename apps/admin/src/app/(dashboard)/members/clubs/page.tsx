"use client"

import {
	Badge,
	Button,
	Card,
	EmptyState,
	H1,
	PageSizeSelect,
	Pagination,
	SearchInput,
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

import { type ClubData, listClubsAction } from "./actions"

const clubGlobalFilterFn: FilterFn<ClubData> = (row, _columnId, filterValue) => {
	const term = (filterValue as string).toLowerCase()
	if (!term) return true

	const c = row.original
	return (
		c.name.toLowerCase().includes(term) ||
		(c.golfCourseName ?? "").toLowerCase().includes(term) ||
		c.website.toLowerCase().includes(term)
	)
}

const columns: ColumnDef<ClubData>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
	},
	{
		accessorKey: "golfCourseName",
		header: "Golf Course",
		cell: ({ getValue }) => getValue<string | null>() || "-",
	},
	{
		accessorKey: "website",
		header: "Website",
		enableSorting: false,
		cell: ({ getValue }) => getValue<string>() || "-",
	},
	{
		accessorKey: "size",
		header: "Size",
		cell: ({ getValue }) => getValue<number | null>() ?? "-",
	},
	{
		accessorKey: "isMember",
		header: "Member",
		cell: ({ getValue }) =>
			getValue<boolean>() ? (
				<Badge variant="default" className="bg-green-600">
					Member
				</Badge>
			) : (
				<Badge variant="secondary">No</Badge>
			),
	},
]

function SortIcon({ column }: { column: Column<ClubData> }) {
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

export default function ClubsPage() {
	const router = useRouter()
	const [clubs, setClubs] = useState<ClubData[]>([])
	const [loading, setLoading] = useState(true)
	const [globalFilter, setGlobalFilter] = useState("")
	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25,
	})
	const [pageSizeOption, setPageSizeOption] = useState<string>("25")

	useEffect(() => {
		async function fetchClubs() {
			try {
				const result = await listClubsAction()
				if (result.success && result.data) {
					setClubs(result.data)
				}
			} catch (err) {
				console.error("Failed to fetch clubs:", err)
			} finally {
				setLoading(false)
			}
		}

		fetchClubs()
	}, [])

	const table = useReactTable({
		data: clubs,
		columns,
		state: {
			sorting,
			globalFilter,
			pagination,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		globalFilterFn: clubGlobalFilterFn,
		autoResetPageIndex: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const handlePageSizeChange = (value: string) => {
		setPageSizeOption(value)
		if (value === "all") {
			table.setPageSize(clubs.length || 1)
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
				<H1 variant="secondary">Clubs</H1>
				<Button variant="secondary" onClick={() => router.push("/members/clubs/new")}>
					Add Club
				</Button>
			</div>

			{loading ? (
				<EmptyState message="Loading clubs..." />
			) : clubs.length === 0 ? (
				<EmptyState message="No clubs found" />
			) : (
				<div className="space-y-4">
					{/* Controls row */}
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<SearchInput
							variant="secondary"
							placeholder="Search clubs..."
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
								{filteredCount} {filteredCount === 1 ? "club" : "clubs"}
								{globalFilter && ` (filtered)`}
							</p>
						</div>
					</div>

					{filteredCount === 0 ? (
						<EmptyState message="No clubs match your search" />
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
												onClick={() => router.push(`/members/clubs/${row.original.id}`)}
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
