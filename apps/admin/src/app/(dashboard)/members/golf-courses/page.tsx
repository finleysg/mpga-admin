"use client"

import {
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
	type SortingFn,
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

import { type GolfCourseData, listGolfCoursesAction } from "./actions"

const formatCityState = (city: string, state: string) => {
	if (city && state) return `${city}, ${state}`
	if (city) return city
	if (state) return state
	return "-"
}

const cityStateSortingFn: SortingFn<GolfCourseData> = (rowA, rowB) => {
	const a = rowA.original
	const b = rowB.original
	const cityCompare = a.city.localeCompare(b.city)
	if (cityCompare !== 0) return cityCompare
	return a.state.localeCompare(b.state)
}

const golfCourseGlobalFilterFn: FilterFn<GolfCourseData> = (row, _columnId, filterValue) => {
	const term = (filterValue as string).toLowerCase()
	if (!term) return true

	const course = row.original
	const name = course.name.toLowerCase()
	const email = course.email.toLowerCase()
	const phone = course.phone.toLowerCase()
	const city = course.city.toLowerCase()

	return name.includes(term) || email.includes(term) || phone.includes(term) || city.includes(term)
}

const columns: ColumnDef<GolfCourseData>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
	},
	{
		id: "cityState",
		header: "City/State",
		accessorFn: (row) => formatCityState(row.city, row.state),
		sortingFn: cityStateSortingFn,
	},
	{
		accessorKey: "phone",
		header: "Phone",
		enableSorting: false,
		cell: ({ getValue }) => getValue<string>() || "-",
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ getValue }) => getValue<string>() || "-",
	},
]

function SortIcon({ column }: { column: Column<GolfCourseData> }) {
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

export default function GolfCoursesPage() {
	const router = useRouter()
	const [courses, setCourses] = useState<GolfCourseData[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [globalFilter, setGlobalFilter] = useState("")
	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25,
	})
	const [pageSizeOption, setPageSizeOption] = useState<string>("25")

	useEffect(() => {
		async function fetchCourses() {
			try {
				const result = await listGolfCoursesAction()
				if (result.success && result.data) {
					setCourses(result.data)
				} else {
					setError(result.error ?? "Failed to load golf courses")
				}
			} catch (err) {
				console.error("Failed to fetch golf courses:", err)
				setError("Failed to load golf courses")
			} finally {
				setLoading(false)
			}
		}

		fetchCourses()
	}, [])

	const table = useReactTable({
		data: courses,
		columns,
		state: {
			sorting,
			globalFilter,
			pagination,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		globalFilterFn: golfCourseGlobalFilterFn,
		autoResetPageIndex: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const handlePageSizeChange = (value: string) => {
		setPageSizeOption(value)
		if (value === "all") {
			table.setPageSize(courses.length || 1)
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
				<H1 variant="secondary">Golf Courses</H1>
				<Button variant="secondary" onClick={() => router.push("/members/golf-courses/new")}>
					Add Golf Course
				</Button>
			</div>

			{loading ? (
				<EmptyState message="Loading golf courses..." />
			) : error ? (
				<EmptyState message={error} />
			) : courses.length === 0 ? (
				<EmptyState message="No golf courses found" />
			) : (
				<div className="space-y-4">
					{/* Controls row */}
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<SearchInput
							variant="secondary"
							placeholder="Search golf courses..."
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
								{filteredCount} {filteredCount === 1 ? "course" : "courses"}
								{globalFilter && ` (filtered)`}
							</p>
						</div>
					</div>

					{filteredCount === 0 ? (
						<EmptyState message="No golf courses match your search" />
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
												onClick={() => router.push(`/members/golf-courses/${row.original.id}`)}
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
