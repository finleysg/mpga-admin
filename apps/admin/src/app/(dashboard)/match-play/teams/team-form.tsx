"use client"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Combobox,
	Field,
	FieldError,
	FieldLabel,
	Input,
	Textarea,
	toast,
} from "@mpga/ui"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { type ClubOption, type TeamData, deleteTeamAction, saveTeamAction } from "./actions"

interface TeamFormProps {
	team?: TeamData
	clubs: ClubOption[]
}

export function TeamForm({ team: existingTeam, clubs }: TeamFormProps) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [year, setYear] = useState<string>(
		existingTeam?.year?.toString() ?? new Date().getFullYear().toString(),
	)
	const [groupName, setGroupName] = useState(existingTeam?.groupName ?? "")
	const [clubId, setClubId] = useState<number | null>(existingTeam?.clubId ?? null)
	const [isSenior, setIsSenior] = useState(existingTeam?.isSenior ?? false)
	const [notes, setNotes] = useState(existingTeam?.notes ?? "")

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!groupName.trim()) {
			setError("Group name is required")
			return
		}

		if (!clubId) {
			setError("Club is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveTeamAction({
				id: existingTeam?.id,
				year: parseInt(year, 10),
				groupName: groupName.trim(),
				isSenior,
				clubId,
				notes: notes.trim() || null,
			})

			if (result.success) {
				toast.success(existingTeam ? "Team updated" : "Team created")
				router.push("/match-play/teams")
			} else {
				setError(result.error ?? "Failed to save team")
			}
		} catch (err) {
			console.error("Failed to save team:", err)
			setError("Failed to save team")
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		router.push("/match-play/teams")
	}

	const handleDelete = async () => {
		if (!existingTeam?.id) return

		setDeleting(true)
		setError(null)

		try {
			const result = await deleteTeamAction(existingTeam.id)

			if (result.success) {
				toast.success("Team deleted")
				router.push("/match-play/teams")
			} else {
				setDeleteDialogOpen(false)
				setError(result.error ?? "Failed to delete team")
			}
		} catch (err) {
			console.error("Failed to delete team:", err)
			setDeleteDialogOpen(false)
			setError("Failed to delete team")
		} finally {
			setDeleting(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading">Team Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave} className="space-y-4">
					{/* Row 1: Year and Group Name */}
					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="year">
								Year <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="year"
								type="number"
								value={year}
								onChange={(e) => setYear(e.target.value)}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="groupName">
								Group Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="groupName"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								required
							/>
						</Field>
					</div>

					{/* Row 2: Club */}
					<Field>
						<FieldLabel>
							Club <span className="text-destructive">*</span>
						</FieldLabel>
						<Combobox
							options={clubs.map((c) => ({ value: String(c.id), label: c.name }))}
							value={clubId !== null ? String(clubId) : ""}
							onValueChange={(value) => setClubId(value === "" ? null : parseInt(value, 10))}
							placeholder="Select a club"
							searchPlaceholder="Search clubs..."
						/>
					</Field>

					{/* Row 3: Senior */}
					<Field orientation="horizontal">
						<Checkbox
							id="isSenior"
							checked={isSenior}
							onCheckedChange={(checked) => setIsSenior(checked === true)}
						/>
						<FieldLabel htmlFor="isSenior" className="mb-0">
							Senior Team
						</FieldLabel>
					</Field>

					{/* Row 4: Notes */}
					<Field>
						<FieldLabel htmlFor="notes">Notes</FieldLabel>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={4}
						/>
					</Field>

					{/* Error message */}
					{error && <FieldError>{error}</FieldError>}

					{/* Action buttons */}
					<div className="flex justify-between pt-4">
						{/* Delete button - only shown when editing */}
						{existingTeam && (
							<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
								<AlertDialogTrigger asChild>
									<Button type="button" variant="destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Team</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete the {existingTeam.clubName} team from{" "}
											{existingTeam.groupName}? This action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={(e) => {
												e.preventDefault()
												handleDelete()
											}}
											disabled={deleting}
											className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
										>
											{deleting ? "Deleting..." : "Delete"}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{/* Spacer when no delete button */}
						{!existingTeam && <div />}

						{/* Save/Cancel buttons on the right */}
						<div className="flex gap-2">
							<Button type="button" variant="secondaryoutline" onClick={handleCancel}>
								Cancel
							</Button>
							<Button type="submit" variant="secondary" disabled={saving}>
								{saving ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
