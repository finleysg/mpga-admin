"use client"

import { EmptyState, H1, Pagination, SearchInput, Sheet, toast } from "@mpga/ui"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import type { DuplicateGroup } from "../actions"
import { findDuplicatesAction } from "../actions"
import { DuplicateCard } from "./duplicate-card"
import { MergeDrawer } from "./merge-drawer"

const PAGE_SIZE = 10

export default function DuplicatesPage() {
	const [groups, setGroups] = useState<DuplicateGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [searchFilter, setSearchFilter] = useState("")
	const [currentPage, setCurrentPage] = useState(0)
	const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null)

	useEffect(() => {
		async function load() {
			try {
				const result = await findDuplicatesAction()
				if (result.success && result.data) {
					setGroups(result.data)
				} else {
					toast.error(result.error ?? "Failed to find duplicates")
				}
			} catch {
				toast.error("Failed to find duplicates")
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	const filteredGroups = useMemo(() => {
		if (!searchFilter.trim()) return groups
		const term = searchFilter.toLowerCase()
		return groups.filter((g) =>
			g.contacts.some((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(term)),
		)
	}, [groups, searchFilter])

	const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE))
	const pagedGroups = useMemo(
		() => filteredGroups.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
		[filteredGroups, currentPage],
	)

	const handleMerged = (groupId: string) => {
		setSelectedGroup(null)
		setGroups((prev) => prev.filter((g) => g.id !== groupId))
		setCurrentPage((prev) => {
			const remainingGroups = groups.filter((g) => g.id !== groupId)
			const maxPage = Math.max(0, Math.ceil(remainingGroups.length / PAGE_SIZE) - 1)
			return prev > maxPage ? maxPage : prev
		})
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6">
				<Link
					href="/members/contacts"
					className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
				>
					<ChevronLeft className="mr-1 h-4 w-4" />
					Back to Contacts
				</Link>
				<H1 variant="secondary">Duplicate Contacts</H1>
			</div>

			{loading ? (
				<EmptyState message="Scanning for duplicates..." />
			) : groups.length === 0 ? (
				<EmptyState message="No duplicate contacts found" />
			) : (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<SearchInput
							variant="secondary"
							placeholder="Search groups..."
							value={searchFilter}
							onChange={(e) => {
								setSearchFilter(e.target.value)
								setCurrentPage(0)
							}}
						/>
						<p className="text-sm text-gray-600">
							{filteredGroups.length} {filteredGroups.length === 1 ? "group" : "groups"}
						</p>
					</div>

					{filteredGroups.length === 0 ? (
						<EmptyState message="No groups match your search" />
					) : (
						<>
							<div className="space-y-3">
								{pagedGroups.map((group) => (
									<DuplicateCard key={group.id} group={group} onDeduplicate={setSelectedGroup} />
								))}
							</div>

							{totalPages > 1 && (
								<Pagination
									currentPage={currentPage + 1}
									totalPages={totalPages}
									onPreviousPage={() => setCurrentPage((p) => p - 1)}
									onNextPage={() => setCurrentPage((p) => p + 1)}
								/>
							)}
						</>
					)}
				</div>
			)}

			<Sheet
				open={selectedGroup !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedGroup(null)
				}}
			>
				{selectedGroup && (
					<MergeDrawer
						group={selectedGroup}
						onMerged={handleMerged}
						onClose={() => setSelectedGroup(null)}
					/>
				)}
			</Sheet>
		</div>
	)
}
