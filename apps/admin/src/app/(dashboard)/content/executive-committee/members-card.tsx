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
	deleteCommitteeMemberAction,
	saveCommitteeMemberAction,
	type ClubOption,
	type CommitteeMemberData,
	type ContactOption,
} from "./actions"

interface MembersCardProps {
	initialMembers: CommitteeMemberData[]
	contacts: ContactOption[]
	clubs: ClubOption[]
}

interface EditingMember {
	id?: number
	role: string
	contactId: string
	homeClubId: string
}

export function MembersCard({ initialMembers, contacts, clubs }: MembersCardProps) {
	const [members, setMembers] = useState(initialMembers)
	const [editing, setEditing] = useState<EditingMember | null>(null)
	const [saving, setSaving] = useState(false)
	const [deleteId, setDeleteId] = useState<number | null>(null)

	const handleAdd = () => {
		setEditing({ role: "", contactId: "", homeClubId: "" })
	}

	const handleEdit = (m: CommitteeMemberData) => {
		setEditing({
			id: m.id,
			role: m.role,
			contactId: String(m.contactId),
			homeClubId: String(m.homeClubId),
		})
	}

	const handleCancel = () => {
		setEditing(null)
	}

	const handleSave = async () => {
		if (!editing) return

		const contactId = Number(editing.contactId)
		const homeClubId = Number(editing.homeClubId)

		if (!editing.role.trim()) {
			toast.error("Role is required")
			return
		}
		if (!contactId) {
			toast.error("Contact is required")
			return
		}
		if (!homeClubId) {
			toast.error("Home club is required")
			return
		}

		setSaving(true)
		try {
			const result = await saveCommitteeMemberAction({
				id: editing.id,
				role: editing.role,
				contactId,
				homeClubId,
			})

			if (result.success && result.data) {
				const contactName = contacts.find((c) => c.id === contactId)?.name ?? ""
				const homeClubName = clubs.find((c) => c.id === homeClubId)?.name ?? ""

				if (editing.id) {
					setMembers((prev) =>
						prev.map((m) =>
							m.id === editing.id
								? {
										...m,
										role: editing.role,
										contactId,
										contactName,
										homeClubId,
										homeClubName,
									}
								: m,
						),
					)
				} else {
					setMembers((prev) =>
						[
							...prev,
							{
								id: result.data!.id,
								role: editing.role,
								contactId,
								contactName,
								homeClubId,
								homeClubName,
							},
						].sort((a, b) => a.role.localeCompare(b.role)),
					)
				}
				setEditing(null)
				toast.success(editing.id ? "Member updated" : "Member added")
			} else {
				toast.error(result.error ?? "Failed to save member")
			}
		} catch {
			toast.error("Failed to save member")
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (deleteId === null) return

		try {
			const result = await deleteCommitteeMemberAction(deleteId)
			if (result.success) {
				setMembers((prev) => prev.filter((m) => m.id !== deleteId))
				toast.success("Member deleted")
			} else {
				toast.error(result.error ?? "Failed to delete member")
			}
		} catch {
			toast.error("Failed to delete member")
		} finally {
			setDeleteId(null)
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-heading">Executive Committee</CardTitle>
				<Button variant="secondaryoutline" size="sm" onClick={handleAdd}>
					<Plus className="mr-1 h-4 w-4" />
					Add Member
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				{editing && !editing.id && (
					<EditForm
						editing={editing}
						setEditing={setEditing}
						contacts={contacts}
						clubs={clubs}
						onSave={handleSave}
						onCancel={handleCancel}
						saving={saving}
					/>
				)}

				{members.map((m) =>
					editing?.id === m.id ? (
						<EditForm
							key={m.id}
							editing={editing}
							setEditing={setEditing}
							contacts={contacts}
							clubs={clubs}
							onSave={handleSave}
							onCancel={handleCancel}
							saving={saving}
						/>
					) : (
						<Item key={m.id} variant="outline" size="sm">
							<ItemContent>
								<ItemTitle>{m.role}</ItemTitle>
								<ItemDescription>{m.contactName}</ItemDescription>
								<ItemDescription className="truncate text-xs">{m.homeClubName}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</ItemActions>
						</Item>
					),
				)}

				{members.length === 0 && !editing && (
					<p className="text-sm text-muted-foreground">No committee members yet.</p>
				)}
			</CardContent>

			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this committee member? This action cannot be undone.
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
	contacts,
	clubs,
	onSave,
	onCancel,
	saving,
}: {
	editing: EditingMember
	setEditing: (e: EditingMember | null) => void
	contacts: ContactOption[]
	clubs: ClubOption[]
	onSave: () => void
	onCancel: () => void
	saving: boolean
}) {
	return (
		<div className="space-y-2 rounded-md border border-secondary-200 p-3">
			<Field>
				<FieldLabel htmlFor="member-role">Role</FieldLabel>
				<Input
					id="member-role"
					value={editing.role}
					onChange={(e) => setEditing({ ...editing, role: e.target.value })}
					placeholder="e.g. President"
				/>
			</Field>
			<div className="grid grid-cols-2 gap-2">
				<Field>
					<FieldLabel htmlFor="member-contact">Contact</FieldLabel>
					<Select
						value={editing.contactId}
						onValueChange={(value) => setEditing({ ...editing, contactId: value })}
					>
						<SelectTrigger id="member-contact">
							<SelectValue placeholder="Select contact" />
						</SelectTrigger>
						<SelectContent>
							{contacts.map((c) => (
								<SelectItem key={c.id} value={String(c.id)}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Field>
					<FieldLabel htmlFor="member-club">Home Club</FieldLabel>
					<Select
						value={editing.homeClubId}
						onValueChange={(value) => setEditing({ ...editing, homeClubId: value })}
					>
						<SelectTrigger id="member-club">
							<SelectValue placeholder="Select club" />
						</SelectTrigger>
						<SelectContent>
							{clubs.map((c) => (
								<SelectItem key={c.id} value={String(c.id)}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			</div>
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
