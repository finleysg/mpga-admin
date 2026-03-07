"use client"

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	EmptyState,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@mpga/ui"
import { ChevronRight, Copy, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import {
	addGroupAction,
	copyGroupsAction,
	deleteGroupAction,
	listGroupsAction,
	updateGroupAction,
} from "./actions"

interface GroupData {
	id: number
	year: number
	groupName: string
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)

export function GroupsManager() {
	const [mounted, setMounted] = useState(false)
	const [year, setYear] = useState(currentYear)
	const [groups, setGroups] = useState<GroupData[]>([])
	const [loading, setLoading] = useState(true)
	const [newGroupName, setNewGroupName] = useState("")
	const [adding, setAdding] = useState(false)
	const [copyFromYear, setCopyFromYear] = useState<string>("")
	const [copying, setCopying] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editName, setEditName] = useState("")
	const [saving, setSaving] = useState(false)

	useEffect(() => setMounted(true), [])

	const fetchGroups = async (y: number) => {
		setLoading(true)
		try {
			const result = await listGroupsAction(y)
			if (result.success && result.data) {
				setGroups(result.data)
			}
		} catch (err) {
			console.error("Failed to fetch groups:", err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchGroups(year)
	}, [year])

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newGroupName.trim()) return

		setAdding(true)
		try {
			const result = await addGroupAction(year, newGroupName.trim())
			if (result.success) {
				toast.success(`Group "${newGroupName.trim()}" added`)
				setNewGroupName("")
				fetchGroups(year)
			} else {
				toast.error(result.error ?? "Failed to add group")
			}
		} catch {
			toast.error("Failed to add group")
		} finally {
			setAdding(false)
		}
	}

	const handleDelete = async (id: number, name: string) => {
		try {
			const result = await deleteGroupAction(id)
			if (result.success) {
				toast.success(`Group "${name}" deleted`)
				fetchGroups(year)
			} else {
				toast.error(result.error ?? "Failed to delete group")
			}
		} catch {
			toast.error("Failed to delete group")
		}
	}

	const handleUpdate = async (id: number) => {
		if (!editName.trim()) return

		setSaving(true)
		try {
			const result = await updateGroupAction(id, editName.trim())
			if (result.success) {
				toast.success(`Group renamed to "${editName.trim()}"`)
				setEditingId(null)
				setEditName("")
				fetchGroups(year)
			} else {
				toast.error(result.error ?? "Failed to update group")
			}
		} catch {
			toast.error("Failed to update group")
		} finally {
			setSaving(false)
		}
	}

	const handleCopy = async () => {
		if (!copyFromYear) return

		setCopying(true)
		try {
			const result = await copyGroupsAction(parseInt(copyFromYear, 10), year)
			if (result.success && result.data) {
				toast.success(`Copied ${result.data.count} group(s) from ${copyFromYear}`)
				setCopyFromYear("")
				fetchGroups(year)
			} else {
				toast.error(result.error ?? "Failed to copy groups")
			}
		} catch {
			toast.error("Failed to copy groups")
		} finally {
			setCopying(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* Year selector */}
			<div className="flex items-center gap-2">
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

			<Card>
				<CardHeader>
					<CardTitle className="font-heading">Groups for {year}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Add group form */}
					<form onSubmit={handleAdd} className="flex gap-2">
						<Input
							value={newGroupName}
							onChange={(e) => setNewGroupName(e.target.value)}
							placeholder="Group name (e.g. A, B, C)"
							className="max-w-xs"
						/>
						<Button type="submit" variant="secondary" disabled={adding || !newGroupName.trim()}>
							<Plus className="mr-1 h-4 w-4" />
							Add
						</Button>
					</form>

					{/* Group list */}
					{loading ? (
						<EmptyState message="Loading groups..." />
					) : groups.length === 0 ? (
						<EmptyState message={`No groups defined for ${year}`} />
					) : (
						<ul className="divide-y divide-gray-100">
							{groups.map((group) => (
								<Collapsible
									key={group.id}
									asChild
									open={editingId === group.id}
									onOpenChange={(open) => {
										if (open) {
											setEditingId(group.id)
											setEditName(group.groupName)
										} else {
											setEditingId(null)
											setEditName("")
										}
									}}
								>
									<li>
										<div className="flex items-center justify-between py-2">
											<CollapsibleTrigger className="flex items-center gap-1 cursor-pointer">
												<ChevronRight
													className={`h-4 w-4 text-gray-400 transition-transform ${editingId === group.id ? "rotate-90" : ""}`}
												/>
												<span className="font-medium">{group.groupName}</span>
											</CollapsibleTrigger>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(group.id, group.groupName)}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</div>
										<CollapsibleContent>
											<div className="flex items-center gap-2 pb-3 pl-5">
												<Input
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
													className="max-w-xs"
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault()
															handleUpdate(group.id)
														}
													}}
												/>
												<Button
													variant="secondary"
													size="sm"
													disabled={saving || !editName.trim()}
													onClick={() => handleUpdate(group.id)}
												>
													Save
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setEditingId(null)
														setEditName("")
													}}
												>
													Cancel
												</Button>
											</div>
										</CollapsibleContent>
									</li>
								</Collapsible>
							))}
						</ul>
					)}

					{/* Copy from year */}
					<div className="border-t pt-4">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600">Copy from:</span>
							{mounted ? (
								<Select value={copyFromYear} onValueChange={setCopyFromYear}>
									<SelectTrigger className="w-28">
										<SelectValue placeholder="Year" />
									</SelectTrigger>
									<SelectContent>
										{yearOptions
											.filter((y) => y !== year)
											.map((y) => (
												<SelectItem key={y} value={String(y)}>
													{y}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							) : (
								<div className="h-9 w-28 rounded-md border bg-transparent" />
							)}
							<Button
								variant="secondaryoutline"
								disabled={copying || !copyFromYear}
								onClick={handleCopy}
							>
								<Copy className="mr-1 h-4 w-4" />
								Copy Groups
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
