"use client"

import type { ActionResult } from "@mpga/types"
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
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldError,
	FieldLabel,
	Input,
	Label,
} from "@mpga/ui"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import {
	getFolderAccessAction,
	setFolderRestrictionAction,
} from "@/app/(dashboard)/library/actions"
import { restrictionsLostByMove } from "@/lib/library/access"
import type { FolderAccess } from "@/lib/library/admin"
import type { FolderSummary } from "@/lib/library/service"

import { FolderPicker } from "./folder-picker"

interface DialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onDone: () => void
}

// ---------- Rename ----------

export function RenameDialog({
	open,
	onOpenChange,
	onDone,
	title,
	initialName,
	maxLength,
	hint,
	save,
}: DialogProps & {
	title: string
	initialName: string
	maxLength: number
	hint?: string
	save: (name: string) => Promise<ActionResult<unknown>>
}) {
	const [name, setName] = useState(initialName)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		const result = await save(name)
		setSaving(false)
		if (!result.success) return setError(result.error ?? "Couldn't rename.")
		onOpenChange(false)
		onDone()
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next)
				if (next) {
					setName(initialName)
					setError(null)
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={submit} className="grid gap-4">
					<DialogHeader>
						<DialogTitle className="font-heading text-secondary-500">{title}</DialogTitle>
					</DialogHeader>
					<Field>
						<FieldLabel htmlFor="rename-input">Name</FieldLabel>
						<Input
							id="rename-input"
							value={name}
							maxLength={maxLength}
							onChange={(e) => setName(e.target.value)}
							autoFocus
							required
						/>
						{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
						{error && <FieldError>{error}</FieldError>}
					</Field>
					<DialogFooter>
						<Button type="submit" disabled={saving || !name.trim()}>
							{saving ? "Saving…" : "Rename"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

// ---------- Move ----------

export function MoveDialog({
	open,
	onOpenChange,
	onDone,
	itemName,
	folders,
	currentParentId,
	allowTopLevel,
	disabled,
	move,
}: DialogProps & {
	itemName: string
	folders: FolderSummary[]
	currentParentId: number | null
	allowTopLevel: boolean
	disabled: Map<number, string>
	move: (target: number | null) => Promise<ActionResult<unknown>>
}) {
	const [target, setTarget] = useState<number | null | undefined>(undefined)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	const nodes = folders.map((f) => ({ ...f, deletedAt: null }))
	const lost = target === undefined ? [] : restrictionsLostByMove(nodes, currentParentId, target)
	const unchanged = target === currentParentId

	async function submit() {
		if (target === undefined) return
		setSaving(true)
		const result = await move(target)
		setSaving(false)
		if (!result.success) return setError(result.error ?? "Couldn't move.")
		onOpenChange(false)
		onDone()
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next)
				if (next) {
					setTarget(undefined)
					setError(null)
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-heading text-secondary-500">Move {itemName}</DialogTitle>
					<DialogDescription>Choose where it should go.</DialogDescription>
				</DialogHeader>
				<FolderPicker
					folders={folders}
					value={target}
					onChange={setTarget}
					allowTopLevel={allowTopLevel}
					disabled={disabled}
				/>
				{lost.length > 0 && (
					<p className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
						<span>
							It will no longer be inside the restricted folder
							{lost.length > 1 ? "s" : ""} {lost.map((f) => `"${f.name}"`).join(", ")}, so more
							people may be able to see it.
						</span>
					</p>
				)}
				{error && <FieldError>{error}</FieldError>}
				<DialogFooter>
					<Button onClick={submit} disabled={saving || target === undefined || unchanged}>
						{saving ? "Moving…" : lost.length > 0 ? "Move anyway" : "Move"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// ---------- Delete ----------

export function DeleteDialog({
	open,
	onOpenChange,
	onDone,
	title,
	description,
	remove,
}: DialogProps & {
	title: string
	description: string
	remove: () => Promise<ActionResult<unknown>>
}) {
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	async function confirm(e: React.MouseEvent) {
		e.preventDefault()
		setSaving(true)
		const result = await remove()
		setSaving(false)
		if (!result.success) return setError(result.error ?? "Couldn't delete.")
		onOpenChange(false)
		onDone()
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next)
				if (next) setError(null)
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="font-heading text-secondary-500">{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				{error && <FieldError>{error}</FieldError>}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={confirm} disabled={saving}>
						{saving ? "Deleting…" : "Move to Trash"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

// ---------- Restrict access ----------

export function RestrictDialog({
	open,
	onOpenChange,
	onDone,
	folderId,
	folderName,
}: DialogProps & { folderId: number; folderName: string }) {
	const [access, setAccess] = useState<FolderAccess | null>(null)
	const [restricted, setRestricted] = useState(false)
	const [chosen, setChosen] = useState<Set<string>>(new Set())
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		let cancelled = false
		getFolderAccessAction(folderId).then((result) => {
			if (cancelled) return
			if (!result.success || !result.data) {
				setError(result.error ?? "Couldn't load access.")
				return
			}
			setAccess(result.data)
			setRestricted(result.data.isRestricted)
			setChosen(new Set(result.data.memberIds))
			setError(null)
		})
		return () => {
			cancelled = true
		}
	}, [open, folderId])

	function toggle(id: string, on: boolean) {
		setChosen((prev) => {
			const next = new Set(prev)
			if (on) next.add(id)
			else next.delete(id)
			return next
		})
	}

	async function submit() {
		setSaving(true)
		const result = await setFolderRestrictionAction(folderId, restricted, [...chosen])
		setSaving(false)
		if (!result.success) return setError(result.error ?? "Couldn't save.")
		onOpenChange(false)
		onDone()
	}

	const board = access?.members.filter((m) => !m.isDocumentAdmin) ?? []
	const admins = access?.members.filter((m) => m.isDocumentAdmin) ?? []

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next)
				if (!next) setAccess(null)
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-heading text-secondary-500">Restrict access</DialogTitle>
					<DialogDescription>
						Limit {folderName} and everything in it to chosen board members. Others won&apos;t see
						that it exists.
					</DialogDescription>
				</DialogHeader>

				{!access && !error ? (
					<div className="flex justify-center py-8">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" />
					</div>
				) : access ? (
					<div className="grid gap-4">
						<div className="flex items-center gap-2">
							<Checkbox
								id="restrict-toggle"
								checked={restricted}
								onCheckedChange={(v) => setRestricted(v === true)}
							/>
							<Label htmlFor="restrict-toggle">Restrict this folder</Label>
						</div>
						{restricted && (
							<div className="max-h-72 space-y-3 overflow-y-auto rounded-md border p-3">
								<fieldset className="space-y-2">
									<legend className="mb-1 text-sm font-medium">Board members</legend>
									{board.length === 0 && (
										<p className="text-sm text-muted-foreground">No board members yet.</p>
									)}
									{board.map((m) => (
										<div key={m.id} className="flex items-center gap-2">
											<Checkbox
												id={`member-${m.id}`}
												checked={chosen.has(m.id)}
												onCheckedChange={(v) => toggle(m.id, v === true)}
											/>
											<Label htmlFor={`member-${m.id}`} className="font-normal">
												{m.name} <span className="text-muted-foreground">{m.email}</span>
											</Label>
										</div>
									))}
								</fieldset>
								<fieldset className="space-y-2">
									<legend className="mb-1 text-sm font-medium">
										Document admins (always included)
									</legend>
									{admins.map((m) => (
										<div key={m.id} className="flex items-center gap-2">
											<Checkbox id={`admin-${m.id}`} checked disabled />
											<Label htmlFor={`admin-${m.id}`} className="font-normal">
												{m.name} <span className="text-muted-foreground">{m.email}</span>
											</Label>
										</div>
									))}
								</fieldset>
							</div>
						)}
					</div>
				) : null}

				{error && <FieldError>{error}</FieldError>}
				<DialogFooter>
					<Button onClick={submit} disabled={saving || !access}>
						{saving ? "Saving…" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
