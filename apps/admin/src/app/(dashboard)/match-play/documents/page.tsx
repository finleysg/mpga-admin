"use client"

import { getMediaUrl } from "@mpga/types"
import {
	Badge,
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
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useTableSearchParams, useYearSearchParam } from "@/hooks/use-table-search-params"
import type { DocumentDataFull } from "@/lib/documents"

import { listMatchPlayDocumentsAction } from "./actions"

const globalFilterFn: FilterFn<DocumentDataFull> = (row, _columnId, filterValue) => {
	const term = (filterValue as string).toLowerCase()
	if (!term) return true

	const d = row.original
	return d.title.toLowerCase().includes(term) || d.documentType.toLowerCase().includes(term)
}

const columns: ColumnDef<DocumentDataFull>[] = [
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
	},
	{
		accessorKey: "documentType",
		header: "Type",
		cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
	},
	{
		accessorKey: "file",
		header: "File",
		enableSorting: false,
		cell: ({ getValue }) => {
			const file = getValue<string | null>()
			if (!file) return "-"
			return (
				<a
					href={getMediaUrl(file)}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					<ExternalLink className="h-3 w-3" />
					View
				</a>
			)
		},
	},
	{
		accessorKey: "lastUpdate",
		header: "Last Update",
		cell: ({ getValue }) => {
			const val = getValue<string>()
			if (!val) return "-"
			return new Date(val).toLocaleDateString()
		},
	},
]

function SortIcon({ column }: { column: Column<DocumentDataFull> }) {
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

export default function MatchPlayDocumentsPage() {
	const router = useRouter()
	const [documents, setDocuments] = useState<DocumentDataFull[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [year, setYear] = useYearSearchParam(currentYear)
	const {
		globalFilter,
		setGlobalFilter,
		sorting,
		setSorting,
		pagination,
		setPagination,
		pageSizeOption,
		setPageSizeOption,
	} = useTableSearchParams({ defaultSort: [{ id: "lastUpdate", desc: true }] })
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	useEffect(() => {
		async function fetchDocuments() {
			setLoading(true)
			try {
				const result = await listMatchPlayDocumentsAction(year)
				if (result.success && result.data) {
					setDocuments(result.data)
				} else {
					setError(result.error ?? "Failed to load documents")
				}
			} catch (err) {
				console.error("Failed to fetch documents:", err)
				setError("Failed to load documents")
			} finally {
				setLoading(false)
			}
		}

		fetchDocuments()
	}, [year])

	const table = useReactTable({
		data: documents,
		columns,
		state: {
			sorting,
			globalFilter,
			pagination,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		globalFilterFn,
		autoResetPageIndex: false,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const handlePageSizeChange = (value: string) => {
		setPageSizeOption(value)
	}

	const filteredCount = table.getFilteredRowModel().rows.length
	const showPagination = pageSizeOption !== "all" && table.getPageCount() > 1

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-6 flex items-center justify-between">
				<H1 variant="secondary">Match Play Documents</H1>
				<Button variant="secondary" onClick={() => router.push("/match-play/documents/new")}>
					Add Document
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
				<EmptyState message="Loading documents..." />
			) : error ? (
				<EmptyState message={error} />
			) : documents.length === 0 ? (
				<EmptyState message={`No documents found for ${year}`} />
			) : (
				<div className="space-y-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<SearchInput
							variant="secondary"
							placeholder="Search documents..."
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
								{filteredCount} {filteredCount === 1 ? "document" : "documents"}
								{globalFilter && ` (filtered)`}
							</p>
						</div>
					</div>

					{filteredCount === 0 ? (
						<EmptyState message="No documents match your search" />
					) : (
						<>
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
												onClick={() => router.push(`/match-play/documents/${row.original.id}`)}
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
