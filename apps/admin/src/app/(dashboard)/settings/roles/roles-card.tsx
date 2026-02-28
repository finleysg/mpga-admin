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
	ItemTitle,
	toast,
} from "@mpga/ui"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

import { deleteRoleAction, type RoleData, saveRoleAction } from "./actions"

interface RolesCardProps {
	initialRoles: RoleData[]
}

interface EditingRole {
	id?: number
	name: string
}

export function RolesCard({ initialRoles }: RolesCardProps) {
	const [roles, setRoles] = useState(initialRoles)
	const [editing, setEditing] = useState<EditingRole | null>(null)
	const [saving, setSaving] = useState(false)
	const [deleteId, setDeleteId] = useState<number | null>(null)

	const handleAdd = () => {
		setEditing({ name: "" })
	}

	const handleEdit = (r: RoleData) => {
		setEditing({ id: r.id, name: r.name })
	}

	const handleCancel = () => {
		setEditing(null)
	}

	const handleSave = async () => {
		if (!editing) return

		if (!editing.name.trim()) {
			toast.error("Name is required")
			return
		}

		setSaving(true)
		try {
			const result = await saveRoleAction({
				id: editing.id,
				name: editing.name,
			})

			if (result.success && result.data) {
				if (editing.id) {
					setRoles((prev) =>
						prev
							.map((r) => (r.id === editing.id ? { ...r, name: editing.name } : r))
							.sort((a, b) => a.name.localeCompare(b.name)),
					)
				} else {
					setRoles((prev) =>
						[...prev, { id: result.data!.id, name: editing.name }].sort((a, b) =>
							a.name.localeCompare(b.name),
						),
					)
				}
				setEditing(null)
				toast.success(editing.id ? "Role updated" : "Role added")
			} else {
				toast.error(result.error ?? "Failed to save role")
			}
		} catch {
			toast.error("Failed to save role")
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (deleteId === null) return

		try {
			const result = await deleteRoleAction(deleteId)
			if (result.success) {
				setRoles((prev) => prev.filter((r) => r.id !== deleteId))
				toast.success("Role deleted")
			} else {
				toast.error(result.error ?? "Failed to delete role")
			}
		} catch {
			toast.error("Failed to delete role")
		} finally {
			setDeleteId(null)
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-heading">Club Contact Roles</CardTitle>
				<Button variant="secondaryoutline" size="sm" onClick={handleAdd}>
					<Plus className="mr-1 h-4 w-4" />
					Add Role
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

				{roles.map((r) =>
					editing?.id === r.id ? (
						<EditForm
							key={r.id}
							editing={editing}
							setEditing={setEditing}
							onSave={handleSave}
							onCancel={handleCancel}
							saving={saving}
						/>
					) : (
						<Item key={r.id} variant="outline" size="sm">
							<ItemContent>
								<ItemTitle>{r.name}</ItemTitle>
							</ItemContent>
							<ItemActions>
								<Button variant="ghost" size="sm" onClick={() => handleEdit(r)}>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</ItemActions>
						</Item>
					),
				)}

				{roles.length === 0 && !editing && (
					<p className="text-sm text-muted-foreground">No roles defined yet.</p>
				)}
			</CardContent>

			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Role</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this role? This action cannot be undone. Roles that
							are currently assigned to contacts cannot be deleted.
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
	editing: EditingRole
	setEditing: (e: EditingRole | null) => void
	onSave: () => void
	onCancel: () => void
	saving: boolean
}) {
	return (
		<div className="space-y-2 rounded-md border border-secondary-200 p-3">
			<Field>
				<FieldLabel htmlFor="role-name">Name</FieldLabel>
				<Input
					id="role-name"
					value={editing.name}
					onChange={(e) => setEditing({ ...editing, name: e.target.value })}
					placeholder="e.g. Men's Club President"
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
