"use client"

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Field,
	FieldError,
	FieldLabel,
	Input,
} from "@mpga/ui"
import { FolderPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { createFolderAction } from "@/app/(dashboard)/library/actions"
import { folderHref } from "@/lib/library/links"
import { MAX_FOLDER_NAME } from "@/lib/library/names"

export function NewFolderDialog({ parentId }: { parentId: number | null }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		setError(null)
		const result = await createFolderAction(parentId, name)
		setSaving(false)
		if (!result.success || !result.data) {
			setError(result.error ?? "The folder couldn't be created.")
			return
		}
		setOpen(false)
		setName("")
		router.push(folderHref(result.data.id))
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) setError(null)
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline">
					<FolderPlus className="h-4 w-4" />
					New folder
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<form onSubmit={submit} className="grid gap-4">
					<DialogHeader>
						<DialogTitle className="font-heading text-secondary-500">New folder</DialogTitle>
					</DialogHeader>
					<Field>
						<FieldLabel htmlFor="folder-name">Name</FieldLabel>
						<Input
							id="folder-name"
							value={name}
							maxLength={MAX_FOLDER_NAME}
							onChange={(e) => setName(e.target.value)}
							autoFocus
							required
						/>
						{error && <FieldError>{error}</FieldError>}
					</Field>
					<DialogFooter>
						<Button type="submit" disabled={saving || !name.trim()}>
							{saving ? "Creating…" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
