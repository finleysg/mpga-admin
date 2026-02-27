"use client"

import { getMediaUrl } from "@mpga/types"
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@mpga/ui"
import { ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { FileDropZone } from "@/components/file-drop-zone"
import { documentTypes as baseDocumentTypes } from "@/lib/document-types"
import type { DocumentDataFull } from "@/lib/documents"

import {
	type TournamentOption,
	deleteDocumentAction,
	saveDocumentAction,
	uploadDocumentFileAction,
} from "./actions"

interface DocumentFormProps {
	document?: DocumentDataFull
	tournaments: TournamentOption[]
}

export function DocumentForm({ document: existing, tournaments }: DocumentFormProps) {
	const documentTypes =
		existing && !baseDocumentTypes.includes(existing.documentType)
			? [...baseDocumentTypes, existing.documentType]
			: baseDocumentTypes
	const router = useRouter()
	const [mounted, setMounted] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [deleteOpen, setDeleteOpen] = useState(false)

	useEffect(() => setMounted(true), [])

	const [title, setTitle] = useState(existing?.title ?? "")
	const [documentType, setDocumentType] = useState(existing?.documentType ?? "Other")
	const [year, setYear] = useState<string>(existing?.year?.toString() ?? "")
	const [tournamentId, setTournamentId] = useState<number | null>(existing?.tournamentId ?? null)
	const [file, setFile] = useState<File | undefined>(undefined)
	const [existingFile, setExistingFile] = useState<string | null>(existing?.file ?? null)

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!title.trim()) {
			setError("Title is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const yearNum = year ? parseInt(year, 10) : null
			if (year && (isNaN(yearNum!) || yearNum! < 1900 || yearNum! > 2100)) {
				setError("Year must be a valid 4-digit year")
				setSaving(false)
				return
			}

			const result = await saveDocumentAction({
				id: existing?.id,
				title: title.trim(),
				documentType,
				year: yearNum,
				tournamentId,
			})

			if (result.success && result.data) {
				const docId = result.data.id

				if (file) {
					const formData = new FormData()
					formData.append("file", file)
					formData.append("documentId", docId.toString())
					const uploadResult = await uploadDocumentFileAction(formData)
					if (uploadResult.success && uploadResult.data) {
						setExistingFile(uploadResult.data.file)
					} else {
						toast.error(uploadResult.error ?? "Document saved but file upload failed")
					}
				}

				if (existing) {
					toast.success("Document updated")
				} else {
					toast.success("Document created")
					router.push(`/settings/documents/${docId}`)
				}
			} else {
				setError(result.error ?? "Failed to save document")
			}
		} catch (err) {
			console.error("Failed to save document:", err)
			setError("Failed to save document")
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!existing) return

		try {
			const result = await deleteDocumentAction(existing.id)
			if (result.success) {
				toast.success("Document deleted")
				router.push("/settings/documents")
			} else {
				setError(result.error ?? "Failed to delete document")
			}
		} catch (err) {
			console.error("Failed to delete document:", err)
			setError("Failed to delete document")
		} finally {
			setDeleteOpen(false)
		}
	}

	const handleCancel = () => {
		router.push("/settings/documents")
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading text-xl">Document Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave} className="space-y-4">
					<Field>
						<FieldLabel htmlFor="title">
							Title <span className="text-destructive">*</span>
						</FieldLabel>
						<Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
					</Field>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<Field>
							<FieldLabel>Type</FieldLabel>
							{mounted ? (
								<Select value={documentType} onValueChange={setDocumentType}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{documentTypes.map((t) => (
											<SelectItem key={t} value={t}>
												{t}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<div className="h-9 rounded-md border bg-transparent" />
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor="year">Year</FieldLabel>
							<Input
								id="year"
								type="number"
								value={year}
								onChange={(e) => setYear(e.target.value)}
								placeholder="e.g. 2026"
							/>
						</Field>

						<Field>
							<FieldLabel>Tournament</FieldLabel>
							{mounted ? (
								<Select
									value={tournamentId !== null ? String(tournamentId) : "none"}
									onValueChange={(value) =>
										setTournamentId(value === "none" ? null : parseInt(value, 10))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										{tournaments.map((t) => (
											<SelectItem key={t.id} value={String(t.id)}>
												{t.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<div className="h-9 rounded-md border bg-transparent" />
							)}
						</Field>
					</div>

					<Field>
						<FieldLabel>File</FieldLabel>
						{existingFile && (
							<a
								href={getMediaUrl(existingFile)}
								target="_blank"
								rel="noopener noreferrer"
								className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
							>
								<ExternalLink className="h-3 w-3" />
								View current file
							</a>
						)}
						<FileDropZone file={file} onFileChange={(f) => setFile(f)} />
					</Field>

					{error && <FieldError>{error}</FieldError>}

					<div className="flex justify-between pt-4">
						{existing ? (
							<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
								<AlertDialogTrigger asChild>
									<Button type="button" variant="destructive">
										Delete
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Document</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete this document? This action cannot be undone.
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
						) : (
							<div />
						)}
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
