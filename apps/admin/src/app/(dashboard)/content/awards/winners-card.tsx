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
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Field,
	FieldLabel,
	Input,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
	Textarea,
	toast,
} from "@mpga/ui"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

import { deleteAwardWinnerAction, saveAwardWinnerAction, type AwardWinnerData } from "./actions"

interface WinnersCardProps {
	initialWinners: AwardWinnerData[]
	awardId: number
}

interface EditingWinner {
	id?: number
	year: string
	winner: string
	notes: string
}

export function WinnersCard({ initialWinners, awardId }: WinnersCardProps) {
	const [winners, setWinners] = useState(initialWinners)
	const [editing, setEditing] = useState<EditingWinner | null>(null)
	const [saving, setSaving] = useState(false)
	const [deleteId, setDeleteId] = useState<number | null>(null)

	const handleAdd = () => {
		setEditing({ year: String(new Date().getFullYear()), winner: "", notes: "" })
	}

	const handleEdit = (w: AwardWinnerData) => {
		setEditing({
			id: w.id,
			year: String(w.year),
			winner: w.winner,
			notes: w.notes ?? "",
		})
	}

	const handleCancel = () => {
		setEditing(null)
	}

	const handleSave = async () => {
		if (!editing) return

		setSaving(true)
		try {
			const result = await saveAwardWinnerAction({
				id: editing.id,
				awardId,
				year: Number(editing.year),
				winner: editing.winner,
				notes: editing.notes || null,
			})

			if (result.success && result.data) {
				if (editing.id) {
					setWinners((prev) =>
						prev.map((w) =>
							w.id === editing.id
								? {
										...w,
										year: Number(editing.year),
										winner: editing.winner,
										notes: editing.notes || null,
									}
								: w,
						),
					)
				} else {
					setWinners((prev) =>
						[
							...prev,
							{
								id: result.data!.id,
								year: Number(editing.year),
								winner: editing.winner,
								notes: editing.notes || null,
								awardId,
							},
						].sort((a, b) => b.year - a.year),
					)
				}
				setEditing(null)
				toast.success(editing.id ? "Winner updated" : "Winner added")
			} else {
				toast.error(result.error ?? "Failed to save winner")
			}
		} catch {
			toast.error("Failed to save winner")
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (deleteId === null) return

		try {
			const result = await deleteAwardWinnerAction(deleteId)
			if (result.success) {
				setWinners((prev) => prev.filter((w) => w.id !== deleteId))
				toast.success("Winner deleted")
			} else {
				toast.error(result.error ?? "Failed to delete winner")
			}
		} catch {
			toast.error("Failed to delete winner")
		} finally {
			setDeleteId(null)
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-heading">Award Winners</CardTitle>
				<Button variant="secondaryoutline" size="sm" onClick={handleAdd}>
					<Plus className="mr-1 h-4 w-4" />
					Add Winner
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				{editing && !editing.id && (
					<EditForm
						editing={editing}
						setEditing={setEditing}
						onSave={handleSave}
						onCancel={handleCancel}
						saving={saving}
					/>
				)}

				{winners.map((w) =>
					editing?.id === w.id ? (
						<EditForm
							key={w.id}
							editing={editing}
							setEditing={setEditing}
							onSave={handleSave}
							onCancel={handleCancel}
							saving={saving}
						/>
					) : (
						<Item key={w.id} variant="outline" size="sm">
							<ItemContent>
								<ItemTitle>{w.year}</ItemTitle>
								<ItemDescription>{w.winner}</ItemDescription>
								{w.notes && (
									<ItemDescription className="truncate text-xs">{w.notes}</ItemDescription>
								)}
							</ItemContent>
							<ItemActions>
								<Button variant="ghost" size="sm" onClick={() => handleEdit(w)}>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => setDeleteId(w.id)}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</ItemActions>
						</Item>
					),
				)}

				{winners.length === 0 && !editing && (
					<p className="text-sm text-muted-foreground">No winners yet.</p>
				)}
			</CardContent>

			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Winner</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this winner? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault()
								handleDelete()
							}}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}

function EditForm({
	editing,
	setEditing,
	onSave,
	onCancel,
	saving,
}: {
	editing: EditingWinner
	setEditing: (e: EditingWinner | null) => void
	onSave: () => void
	onCancel: () => void
	saving: boolean
}) {
	return (
		<div className="space-y-2 rounded-md border border-secondary-200 p-3">
			<div className="grid grid-cols-2 gap-2">
				<Field>
					<FieldLabel htmlFor="winner-year">Year</FieldLabel>
					<Input
						id="winner-year"
						type="number"
						value={editing.year}
						onChange={(e) => setEditing({ ...editing, year: e.target.value })}
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="winner-name">Winner</FieldLabel>
					<Input
						id="winner-name"
						value={editing.winner}
						onChange={(e) => setEditing({ ...editing, winner: e.target.value })}
					/>
				</Field>
			</div>
			<Field>
				<FieldLabel htmlFor="winner-notes">Notes</FieldLabel>
				<Textarea
					id="winner-notes"
					value={editing.notes}
					onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
					rows={2}
				/>
			</Field>
			<div className="flex justify-end gap-2">
				<Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
					<X className="mr-1 h-4 w-4" />
					Cancel
				</Button>
				<Button variant="secondary" size="sm" onClick={onSave} disabled={saving}>
					{saving ? "Saving..." : "Save"}
				</Button>
			</div>
		</div>
	)
}
