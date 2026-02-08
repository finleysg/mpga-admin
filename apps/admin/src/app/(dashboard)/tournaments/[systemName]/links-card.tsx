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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@mpga/ui"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

import {
	deleteTournamentLinkAction,
	saveTournamentLinkAction,
	type TournamentLinkData,
} from "./actions"

const linkTypes = ["Registration", "Results", "Tee Times", "Pairings", "Other"]

interface LinksCardProps {
	initialLinks: TournamentLinkData[]
	instanceId: number
}

interface EditingLink {
	id?: number
	title: string
	url: string
	linkType: string
}

export function LinksCard({ initialLinks, instanceId }: LinksCardProps) {
	const [links, setLinks] = useState(initialLinks)
	const [editing, setEditing] = useState<EditingLink | null>(null)
	const [saving, setSaving] = useState(false)
	const [deleteId, setDeleteId] = useState<number | null>(null)

	const handleAdd = () => {
		setEditing({ title: "", url: "", linkType: "Other" })
	}

	const handleEdit = (link: TournamentLinkData) => {
		setEditing({
			id: link.id,
			title: link.title,
			url: link.url,
			linkType: link.linkType,
		})
	}

	const handleCancel = () => {
		setEditing(null)
	}

	const handleSave = async () => {
		if (!editing) return

		setSaving(true)
		try {
			const result = await saveTournamentLinkAction({
				id: editing.id,
				title: editing.title,
				url: editing.url,
				linkType: editing.linkType,
				tournamentInstanceId: instanceId,
			})

			if (result.success && result.data) {
				if (editing.id) {
					setLinks((prev) =>
						prev.map((l) =>
							l.id === editing.id
								? { ...l, title: editing.title, url: editing.url, linkType: editing.linkType }
								: l,
						),
					)
				} else {
					setLinks((prev) => [
						...prev,
						{
							id: result.data!.id,
							title: editing.title,
							url: editing.url,
							linkType: editing.linkType,
							tournamentInstanceId: instanceId,
						},
					])
				}
				setEditing(null)
				toast.success(editing.id ? "Link updated" : "Link added")
			} else {
				toast.error(result.error ?? "Failed to save link")
			}
		} catch {
			toast.error("Failed to save link")
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (deleteId === null) return

		try {
			const result = await deleteTournamentLinkAction(deleteId)
			if (result.success) {
				setLinks((prev) => prev.filter((l) => l.id !== deleteId))
				toast.success("Link deleted")
			} else {
				toast.error(result.error ?? "Failed to delete link")
			}
		} catch {
			toast.error("Failed to delete link")
		} finally {
			setDeleteId(null)
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-heading">Links</CardTitle>
				<Button variant="secondaryoutline" size="sm" onClick={handleAdd}>
					<Plus className="mr-1 h-4 w-4" />
					Add
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

				{links.map((link) =>
					editing?.id === link.id ? (
						<EditForm
							key={link.id}
							editing={editing}
							setEditing={setEditing}
							onSave={handleSave}
							onCancel={handleCancel}
							saving={saving}
						/>
					) : (
						<Item key={link.id} variant="outline" size="sm">
							<ItemContent>
								<ItemTitle>{link.title}</ItemTitle>
								<ItemDescription className="truncate">{link.url}</ItemDescription>
								<ItemDescription className="text-xs">{link.linkType}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Button variant="ghost" size="sm" onClick={() => handleEdit(link)}>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => setDeleteId(link.id)}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</ItemActions>
						</Item>
					),
				)}

				{links.length === 0 && !editing && (
					<p className="text-sm text-muted-foreground">No links yet.</p>
				)}
			</CardContent>

			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Link</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this link? This action cannot be undone.
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
	editing: EditingLink
	setEditing: (e: EditingLink | null) => void
	onSave: () => void
	onCancel: () => void
	saving: boolean
}) {
	return (
		<div className="space-y-2 rounded-md border border-secondary-200 p-3">
			<Field>
				<FieldLabel htmlFor="link-title">Title</FieldLabel>
				<Input
					id="link-title"
					value={editing.title}
					onChange={(e) => setEditing({ ...editing, title: e.target.value })}
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="link-url">URL</FieldLabel>
				<Input
					id="link-url"
					value={editing.url}
					onChange={(e) => setEditing({ ...editing, url: e.target.value })}
				/>
			</Field>
			<Field>
				<FieldLabel>Type</FieldLabel>
				<Select
					value={editing.linkType}
					onValueChange={(value) => setEditing({ ...editing, linkType: value })}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{linkTypes.map((t) => (
							<SelectItem key={t} value={t}>
								{t}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
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
