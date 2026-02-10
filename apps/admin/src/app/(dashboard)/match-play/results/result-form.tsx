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
	Field,
	FieldError,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	toast,
} from "@mpga/ui"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { type ResultData, type TeamOption, deleteResultAction, saveResultAction } from "./actions"

interface ResultFormProps {
	result?: ResultData
	teams: TeamOption[]
}

export function ResultForm({ result: existingResult, teams }: ResultFormProps) {
	const router = useRouter()
	const [mounted, setMounted] = useState(false)
	const [saving, setSaving] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => setMounted(true), [])

	const [groupName, setGroupName] = useState(existingResult?.groupName ?? "")
	const [matchDate, setMatchDate] = useState(existingResult?.matchDate ?? "")
	const [homeTeamId, setHomeTeamId] = useState<number | null>(existingResult?.homeTeamId ?? null)
	const [awayTeamId, setAwayTeamId] = useState<number | null>(existingResult?.awayTeamId ?? null)
	const [homeTeamScore, setHomeTeamScore] = useState(existingResult?.homeTeamScore ?? "0.0")
	const [awayTeamScore, setAwayTeamScore] = useState(existingResult?.awayTeamScore ?? "0.0")
	const [forfeit, setForfeit] = useState(existingResult?.forfeit ?? false)
	const [enteredBy, setEnteredBy] = useState(existingResult?.enteredBy ?? "")
	const [notes, setNotes] = useState(existingResult?.notes ?? "")

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!groupName.trim()) {
			setError("Group name is required")
			return
		}

		if (!matchDate) {
			setError("Match date is required")
			return
		}

		if (!homeTeamId || !awayTeamId) {
			setError("Home and away teams are required")
			return
		}

		if (homeTeamId === awayTeamId) {
			setError("Home and away teams must be different")
			return
		}

		if (!existingResult && !enteredBy.trim()) {
			setError("Entered by is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveResultAction({
				id: existingResult?.id,
				groupName: groupName.trim(),
				matchDate,
				homeTeamId,
				awayTeamId,
				homeTeamScore,
				awayTeamScore,
				forfeit,
				enteredBy: existingResult ? existingResult.enteredBy : enteredBy.trim(),
				notes: notes.trim() || null,
			})

			if (result.success) {
				toast.success(existingResult ? "Result updated" : "Result created")
				router.push("/match-play/results")
			} else {
				setError(result.error ?? "Failed to save result")
			}
		} catch (err) {
			console.error("Failed to save result:", err)
			setError("Failed to save result")
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		router.push("/match-play/results")
	}

	const handleDelete = async () => {
		if (!existingResult?.id) return

		setDeleting(true)
		setError(null)

		try {
			const result = await deleteResultAction(existingResult.id)

			if (result.success) {
				toast.success("Result deleted")
				router.push("/match-play/results")
			} else {
				setDeleteDialogOpen(false)
				setError(result.error ?? "Failed to delete result")
			}
		} catch (err) {
			console.error("Failed to delete result:", err)
			setDeleteDialogOpen(false)
			setError("Failed to delete result")
		} finally {
			setDeleting(false)
		}
	}

	const formatTeamLabel = (t: TeamOption) => `${t.groupName} - ${t.clubName}`

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading">Result Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave} className="space-y-4">
					{/* Row 1: Group Name and Match Date */}
					<div className="grid grid-cols-2 gap-4">
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
						<Field>
							<FieldLabel htmlFor="matchDate">
								Match Date <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="matchDate"
								type="date"
								value={matchDate}
								onChange={(e) => setMatchDate(e.target.value)}
								required
							/>
						</Field>
					</div>

					{/* Row 2: Home Team and Score */}
					<div className="grid grid-cols-[1fr_120px] gap-4">
						<Field>
							<FieldLabel>
								Home Team <span className="text-destructive">*</span>
							</FieldLabel>
							{mounted ? (
								<Select
									value={homeTeamId !== null ? String(homeTeamId) : "none"}
									onValueChange={(value) =>
										setHomeTeamId(value === "none" ? null : parseInt(value, 10))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Select a team</SelectItem>
										{teams.map((t) => (
											<SelectItem key={t.id} value={String(t.id)}>
												{formatTeamLabel(t)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<div className="h-9 rounded-md border bg-transparent" />
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor="homeTeamScore">Home Score</FieldLabel>
							<Input
								id="homeTeamScore"
								value={homeTeamScore}
								onChange={(e) => setHomeTeamScore(e.target.value)}
							/>
						</Field>
					</div>

					{/* Row 3: Away Team and Score */}
					<div className="grid grid-cols-[1fr_120px] gap-4">
						<Field>
							<FieldLabel>
								Away Team <span className="text-destructive">*</span>
							</FieldLabel>
							{mounted ? (
								<Select
									value={awayTeamId !== null ? String(awayTeamId) : "none"}
									onValueChange={(value) =>
										setAwayTeamId(value === "none" ? null : parseInt(value, 10))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Select a team</SelectItem>
										{teams.map((t) => (
											<SelectItem key={t.id} value={String(t.id)}>
												{formatTeamLabel(t)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<div className="h-9 rounded-md border bg-transparent" />
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor="awayTeamScore">Away Score</FieldLabel>
							<Input
								id="awayTeamScore"
								value={awayTeamScore}
								onChange={(e) => setAwayTeamScore(e.target.value)}
							/>
						</Field>
					</div>

					{/* Row 4: Forfeit and Entered By */}
					<div className="grid grid-cols-2 gap-4">
						<Field orientation="horizontal" className="self-end pb-2">
							<Checkbox
								id="forfeit"
								checked={forfeit}
								onCheckedChange={(checked) => setForfeit(checked === true)}
							/>
							<FieldLabel htmlFor="forfeit" className="mb-0">
								Forfeit
							</FieldLabel>
						</Field>
						{existingResult ? (
							<Field>
								<FieldLabel>Entered By</FieldLabel>
								<p className="text-sm text-muted-foreground pt-1">
									{existingResult.enteredBy || "—"}
								</p>
							</Field>
						) : (
							<Field>
								<FieldLabel htmlFor="enteredBy">
									Entered By <span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="enteredBy"
									value={enteredBy}
									onChange={(e) => setEnteredBy(e.target.value)}
									required
								/>
							</Field>
						)}
					</div>

					{/* Row 5: Notes */}
					<Field>
						<FieldLabel htmlFor="notes">Notes</FieldLabel>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
						/>
					</Field>

					{/* Error message */}
					{error && <FieldError>{error}</FieldError>}

					{/* Action buttons */}
					<div className="flex justify-between pt-4">
						{/* Delete button - only shown when editing */}
						{existingResult && (
							<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
								<AlertDialogTrigger asChild>
									<Button type="button" variant="destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Result</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete this match result? This action cannot be
											undone.
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
						{!existingResult && <div />}

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
