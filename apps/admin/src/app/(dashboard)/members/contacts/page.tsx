"use client"

import { Button, H1, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mpga/ui"
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
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ChevronsUpDown,
	Download,
	Search,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ExcelJS from "exceljs"

import { type ContactData, listContactsAction } from "./actions"

const formatCityState = (city: string | null, state: string | null) => {
	if (city && state) return `${city}, ${state}`
	if (city) return city
	if (state) return state
	return "-"
}

const nameSortingFn: SortingFn<ContactData> = (rowA, rowB) => {
	const a = rowA.original
	const b = rowB.original
	const lastNameCompare = (a.lastName ?? "").localeCompare(b.lastName ?? "")
	if (lastNameCompare !== 0) return lastNameCompare
	return (a.firstName ?? "").localeCompare(b.firstName ?? "")
}

const cityStateSortingFn: SortingFn<ContactData> = (rowA, rowB) => {
	const a = rowA.original
	const b = rowB.original
	const cityCompare = (a.city ?? "").localeCompare(b.city ?? "")
	if (cityCompare !== 0) return cityCompare
	return (a.state ?? "").localeCompare(b.state ?? "")
}

const contactGlobalFilterFn: FilterFn<ContactData> = (row, _columnId, filterValue) => {
	const term = (filterValue as string).toLowerCase()
	if (!term) return true

	const contact = row.original
	const firstName = contact.firstName?.toLowerCase() ?? ""
	const lastName = contact.lastName?.toLowerCase() ?? ""
	const email = contact.email?.toLowerCase() ?? ""
	const phone = contact.primaryPhone?.toLowerCase() ?? ""
	const city = contact.city?.toLowerCase() ?? ""

	return (
		firstName.includes(term) ||
		lastName.includes(term) ||
		`${firstName} ${lastName}`.includes(term) ||
		`${lastName}, ${firstName}`.includes(term) ||
		email.includes(term) ||
		phone.includes(term) ||
		city.includes(term)
	)
}

const columns: ColumnDef<ContactData>[] = [
	{
		id: "name",
		header: "Name",
		accessorFn: (row) => `${row.lastName}, ${row.firstName}`,
		sortingFn: nameSortingFn,
		cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ getValue }) => getValue<string | null>() ?? "-",
	},
	{
		accessorKey: "primaryPhone",
		header: "Phone",
		enableSorting: false,
		cell: ({ getValue }) => getValue<string | null>() ?? "-",
	},
	{
		id: "cityState",
		header: "City/State",
		accessorFn: (row) => formatCityState(row.city, row.state),
		sortingFn: cityStateSortingFn,
	},
]

function SortIcon({ column }: { column: Column<ContactData> }) {
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

export default function ContactsPage() {
	const router = useRouter()
	const [contacts, setContacts] = useState<ContactData[]>([])
	const [loading, setLoading] = useState(true)
	const [globalFilter, setGlobalFilter] = useState("")
	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25,
	})
	const [pageSizeOption, setPageSizeOption] = useState<string>("25")

	useEffect(() => {
		async function fetchContacts() {
			try {
				const result = await listContactsAction()
				if (result.success && result.data) {
					setContacts(result.data)
				}
			} catch (err) {
				console.error("Failed to fetch contacts:", err)
			} finally {
				setLoading(false)
			}
		}

		fetchContacts()
	}, [])

	const table = useReactTable({
		data: contacts,
		columns,
		state: {
			sorting,
			globalFilter,
			pagination,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		globalFilterFn: contactGlobalFilterFn,
		autoResetPageIndex: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const handlePageSizeChange = (value: string) => {
		setPageSizeOption(value)
		if (value === "all") {
			table.setPageSize(contacts.length || 1)
		} else {
			table.setPageSize(Number(value))
		}
		table.setPageIndex(0)
	}

	const exportToExcel = async () => {
		const wb = new ExcelJS.Workbook()
		const ws = wb.addWorksheet("Contacts")
		ws.columns = [
			{ header: "Name", key: "name" },
			{ header: "Email", key: "email" },
			{ header: "Phone", key: "phone" },
			{ header: "Alternate Phone", key: "alternatePhone" },
			{ header: "Address", key: "address" },
			{ header: "City", key: "city" },
			{ header: "State", key: "state" },
			{ header: "Zip", key: "zip" },
			{ header: "Send Email", key: "sendEmail" },
		]
		for (const row of table.getFilteredRowModel().rows) {
			ws.addRow({
				name: `${row.original.lastName}, ${row.original.firstName}`,
				email: row.original.email ?? "",
				phone: row.original.primaryPhone ?? "",
				alternatePhone: row.original.alternatePhone ?? "",
				address: row.original.addressText ?? "",
				city: row.original.city ?? "",
				state: row.original.state ?? "",
				zip: row.original.zip ?? "",
				sendEmail: row.original.sendEmail ? "Yes" : "No",
			})
		}
		const buffer = await wb.xlsx.writeBuffer()
		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = "contacts.xlsx"
		a.click()
		URL.revokeObjectURL(url)
	}

	const filteredCount = table.getFilteredRowModel().rows.length
	const showPagination = pageSizeOption !== "all" && table.getPageCount() > 1

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-6 flex items-center justify-between">
				<H1 variant="secondary">Contacts</H1>
				<div className="flex gap-2">
					<Button
						variant="secondaryoutline"
						onClick={() => router.push("/members/contacts/duplicates")}
					>
						Dedupe
					</Button>
					<Button variant="secondary" onClick={() => router.push("/members/contacts/new")}>
						Add Contact
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="py-8 text-center text-gray-500">Loading contacts...</div>
			) : contacts.length === 0 ? (
				<div className="py-8 text-center text-gray-500">No contacts found</div>
			) : (
				<div className="space-y-4">
					{/* Controls row */}
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								placeholder="Search contacts..."
								value={globalFilter}
								onChange={(e) => setGlobalFilter(e.target.value)}
								className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-secondary-500 focus:outline-none focus:ring-1 focus:ring-secondary-500 sm:w-64"
							/>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<label htmlFor="pageSize" className="text-sm text-gray-600">
									Show:
								</label>
								<select
									id="pageSize"
									value={pageSizeOption}
									onChange={(e) => handlePageSizeChange(e.target.value)}
									className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-secondary-500 focus:outline-none focus:ring-1 focus:ring-secondary-500"
								>
									<option value="10">10</option>
									<option value="25">25</option>
									<option value="50">50</option>
									<option value="100">100</option>
									<option value="all">All</option>
								</select>
							</div>
							<p className="text-sm text-gray-600">
								{filteredCount} {filteredCount === 1 ? "contact" : "contacts"}
								{globalFilter && ` (filtered)`}
							</p>
							<Button variant="ghost" size="sm" onClick={exportToExcel}>
								<Download className="mr-1 h-4 w-4" />
								Export
							</Button>
						</div>
					</div>

					{filteredCount === 0 ? (
						<div className="py-8 text-center text-gray-500">No contacts match your search</div>
					) : (
						<>
							{/* Table */}
							<div className="overflow-x-auto rounded-lg bg-white shadow-sm">
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
												onClick={() => router.push(`/members/contacts/${row.original.id}`)}
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
							</div>

							{/* Pagination */}
							{showPagination && (
								<div className="flex items-center justify-center gap-4">
									<Button
										variant="outline"
										size="sm"
										onClick={() => table.previousPage()}
										disabled={!table.getCanPreviousPage()}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<span className="text-sm text-gray-600">
										Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => table.nextPage()}
										disabled={!table.getCanNextPage()}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			)}
		</div>
	)
}
