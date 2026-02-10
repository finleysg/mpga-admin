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
	Field,
	FieldError,
	FieldLabel,
	Input,
	toast,
} from "@mpga/ui"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { MarkdownEditor } from "@/components/markdown-editor"

import { type AnnouncementData, deleteAnnouncementAction, saveAnnouncementAction } from "./actions"

interface AnnouncementFormProps {
	announcement?: AnnouncementData
}

function toDateInputValue(dateStr: string): string {
	const d = new Date(dateStr)
	return d.toISOString().slice(0, 10)
}

function toDateTimeString(dateInput: string): string {
	return `${dateInput} 00:00:00.000000`
}

export function AnnouncementForm({ announcement: existing }: AnnouncementFormProps) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [title, setTitle] = useState(existing?.title ?? "")
	const [text, setText] = useState(existing?.text ?? "")
	const [createDate, setCreateDate] = useState(
		existing?.createDate
			? toDateInputValue(existing.createDate)
			: new Date().toISOString().slice(0, 10),
	)
	const [externalUrl, setExternalUrl] = useState(existing?.externalUrl ?? "")
	const [externalName, setExternalName] = useState(existing?.externalName ?? "")

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!title.trim()) {
			setError("Title is required")
			return
		}

		if (!text.trim()) {
			setError("Text is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveAnnouncementAction({
				id: existing?.id,
				title: title.trim(),
				text: text.trim(),
				createDate: toDateTimeString(createDate),
				externalUrl: externalUrl.trim() || undefined,
				externalName: externalName.trim() || undefined,
			})

			if (result.success) {
				toast.success(existing ? "Announcement updated" : "Announcement created")
				router.push("/content/news")
			} else {
				setError(result.error ?? "Failed to save announcement")
			}
		} catch (err) {
			console.error("Failed to save announcement:", err)
			setError("Failed to save announcement")
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		router.push("/content/news")
	}

	const handleDelete = async () => {
		if (!existing?.id) return

		setDeleting(true)
		setError(null)

		try {
			const result = await deleteAnnouncementAction(existing.id)

			if (result.success) {
				toast.success("Announcement deleted")
				router.push("/content/news")
			} else {
				setDeleteDialogOpen(false)
				setError(result.error ?? "Failed to delete announcement")
			}
		} catch (err) {
			console.error("Failed to delete announcement:", err)
			setDeleteDialogOpen(false)
			setError("Failed to delete announcement")
		} finally {
			setDeleting(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading">Announcement Details</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave} className="space-y-4">
					{/* Row 1: Title and Date */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<Field className="sm:col-span-2">
							<FieldLabel htmlFor="title">
								Title <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								maxLength={100}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="createDate">
								Date <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="createDate"
								type="date"
								value={createDate}
								onChange={(e) => setCreateDate(e.target.value)}
								required
							/>
						</Field>
					</div>

					{/* Row 2: Text (Markdown Editor) */}
					<Field>
						<FieldLabel>
							Text <span className="text-destructive">*</span>
						</FieldLabel>
						<MarkdownEditor value={text} onChange={setText} minHeight="200px" />
					</Field>

					{/* Row 3: External URL and Name */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field>
							<FieldLabel htmlFor="externalUrl">External URL</FieldLabel>
							<Input
								id="externalUrl"
								type="url"
								value={externalUrl}
								onChange={(e) => setExternalUrl(e.target.value)}
								placeholder="https://..."
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="externalName">External Link Label</FieldLabel>
							<Input
								id="externalName"
								value={externalName}
								onChange={(e) => setExternalName(e.target.value)}
								maxLength={40}
								placeholder="Link text"
							/>
						</Field>
					</div>

					{/* Error message */}
					{error && <FieldError>{error}</FieldError>}

					{/* Action buttons */}
					<div className="flex justify-between pt-4">
						{/* Delete button - only shown when editing */}
						{existing && (
							<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
								<AlertDialogTrigger asChild>
									<Button type="button" variant="destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Announcement</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete &ldquo;{existing.title}&rdquo;? This action
											cannot be undone.
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
						{!existing && <div />}

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
