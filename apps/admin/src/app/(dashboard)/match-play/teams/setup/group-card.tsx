"use client"

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Combobox,
	toast,
} from "@mpga/ui"
import { ChevronRight, Save, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { ClubOption } from "../actions"
import {
	type CaptainInfo,
	type GroupWithTeams,
	lookupPriorCaptainsAction,
	saveGroupTeamsAction,
} from "./actions"

interface ClubEntry {
	clubId: number
	clubName: string
	captains: CaptainInfo[]
	isNew: boolean
}

interface GroupCardProps {
	group: GroupWithTeams
	year: number
	clubOptions: ClubOption[]
	onSaved: () => void
}

export function GroupCard({ group, year, clubOptions, onSaved }: GroupCardProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [clubs, setClubs] = useState<ClubEntry[]>([])
	const [isSenior, setIsSenior] = useState(false)
	const [dirty, setDirty] = useState(false)
	const [saving, setSaving] = useState(false)

	// Initialize from existing teams
	useEffect(() => {
		const entries: ClubEntry[] = group.teams.map((t) => ({
			clubId: t.clubId,
			clubName: t.clubName,
			captains: t.captains,
			isNew: false,
		}))
		setClubs(entries)
		setIsSenior(group.teams[0]?.isSenior ?? false)
		setDirty(false)
	}, [group])

	const handleAddClub = useCallback(
		async (value: string) => {
			const clubId = parseInt(value, 10)
			if (isNaN(clubId)) return

			const clubOption = clubOptions.find((c) => c.id === clubId)
			if (!clubOption) return

			// Check if already in this group
			if (clubs.some((c) => c.clubId === clubId)) {
				toast.error("Club is already in this group")
				return
			}

			// Lookup prior year captains filtered by senior status
			const result = await lookupPriorCaptainsAction(clubId, year, isSenior)
			const captains = result.success && result.data ? result.data : []

			setClubs((prev) => [
				...prev,
				{
					clubId,
					clubName: clubOption.name,
					captains,
					isNew: true,
				},
			])
			setDirty(true)
		},
		[clubOptions, clubs, year, isSenior],
	)

	const handleRemoveClub = (clubId: number) => {
		setClubs((prev) => prev.filter((c) => c.clubId !== clubId))
		setDirty(true)
	}

	const handleRemoveCaptain = (clubId: number, contactId: number) => {
		setClubs((prev) =>
			prev.map((c) =>
				c.clubId === clubId
					? { ...c, captains: c.captains.filter((cap) => cap.contactId !== contactId) }
					: c,
			),
		)
		setDirty(true)
	}

	const handleSeniorChange = async (checked: boolean) => {
		setIsSenior(checked)
		setDirty(true)

		// Re-fetch captains for new (unsaved) clubs using updated senior status
		const newClubs = clubs.filter((c) => c.isNew)
		if (newClubs.length === 0) return

		const updated = await Promise.all(
			newClubs.map(async (c) => {
				const result = await lookupPriorCaptainsAction(c.clubId, year, checked)
				return {
					clubId: c.clubId,
					captains: result.success && result.data ? result.data : [],
				}
			}),
		)

		setClubs((prev) =>
			prev.map((c) => {
				if (!c.isNew) return c
				const match = updated.find((u) => u.clubId === c.clubId)
				return match ? { ...c, captains: match.captains } : c
			}),
		)
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			const result = await saveGroupTeamsAction(
				year,
				group.groupName,
				isSenior,
				clubs.map((c) => ({
					clubId: c.clubId,
					captainContactIds: c.captains.map((cap) => cap.contactId),
				})),
			)

			if (result.success) {
				const data = result.data!
				const parts: string[] = []
				if (data.created > 0) parts.push(`${data.created} added`)
				if (data.removed > 0) parts.push(`${data.removed} removed`)
				toast.success(
					parts.length > 0 ? `${group.groupName}: ${parts.join(", ")}` : `${group.groupName} saved`,
				)
				setDirty(false)
				onSaved()
			} else {
				toast.error(result.error ?? "Failed to save")
			}
		} catch {
			toast.error("Failed to save")
		} finally {
			setSaving(false)
		}
	}

	// Filter club options to exclude clubs already in this group
	const availableClubs = useMemo(
		() => clubOptions.filter((c) => !clubs.some((e) => e.clubId === c.id)),
		[clubOptions, clubs],
	)

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card>
				<CardHeader className="p-0">
					<CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 px-6 py-4">
						<ChevronRight
							className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
						/>
						<span className="font-heading text-lg font-semibold">{group.groupName}</span>
						<Badge variant="secondary" className="ml-1">
							{clubs.length} {clubs.length === 1 ? "team" : "teams"}
						</Badge>
						{isSenior && (
							<Badge variant="outline" className="ml-1">
								Senior
							</Badge>
						)}
						{dirty && <span className="ml-auto text-xs text-amber-600">Unsaved changes</span>}
					</CollapsibleTrigger>
				</CardHeader>
				<CollapsibleContent>
					<CardContent className="space-y-4 border-t pt-4">
						{/* Senior toggle */}
						<div className="flex items-center gap-2">
							<Checkbox
								id={`senior-${group.id}`}
								checked={isSenior}
								onCheckedChange={(checked) => handleSeniorChange(checked === true)}
							/>
							<label htmlFor={`senior-${group.id}`} className="text-sm font-medium leading-none">
								Senior group
							</label>
						</div>

						{/* Add club combobox */}
						<div className="max-w-md">
							<Combobox
								options={availableClubs.map((c) => ({
									value: String(c.id),
									label: c.name,
								}))}
								value=""
								onValueChange={handleAddClub}
								placeholder="Add a club..."
								searchPlaceholder="Search clubs..."
								emptyMessage="No clubs found."
							/>
						</div>

						{/* Club list */}
						{clubs.length === 0 ? (
							<p className="text-sm italic text-gray-500">
								No teams in this group yet. Use the search above to add clubs.
							</p>
						) : (
							<ul className="divide-y divide-gray-100">
								{clubs.map((entry) => (
									<li key={entry.clubId} className="flex items-center justify-between py-2">
										<div className="min-w-0">
											<p className="font-medium">{entry.clubName}</p>
											{entry.captains.length > 0 ? (
												<div className="flex flex-wrap gap-1 pt-0.5">
													{entry.captains.map((c) => (
														<span
															key={c.contactId}
															className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
														>
															{c.name}
															<button
																type="button"
																onClick={() => handleRemoveCaptain(entry.clubId, c.contactId)}
																className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
															>
																<X className="h-3 w-3" />
															</button>
														</span>
													))}
												</div>
											) : (
												<p className="text-sm italic text-gray-400">No captains found</p>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleRemoveClub(entry.clubId)}
										>
											<X className="h-4 w-4 text-red-500" />
										</Button>
									</li>
								))}
							</ul>
						)}

						{/* Save button */}
						<div className="flex justify-end pt-2">
							<Button variant="secondary" disabled={!dirty || saving} onClick={handleSave}>
								<Save className="mr-2 h-4 w-4" />
								{saving ? "Saving..." : "Save"}
							</Button>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	)
}
