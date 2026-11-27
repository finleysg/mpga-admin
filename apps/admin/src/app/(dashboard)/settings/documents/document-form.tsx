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

import { getDocumentSourceAction, publishToDocumentAction } from "@/app/(dashboard)/library/actions"
import {
	type CurrentLibrarySource,
	DocumentFileSource,
	type FileSource,
} from "@/components/library/document-file-source"
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
	allowedDocumentTypes?: string[]
	basePath?: string
	saveAction?: typeof saveDocumentAction
	deleteAction?: typeof deleteDocumentAction
	uploadAction?: typeof uploadDocumentFileAction
}

export function DocumentForm({
	document: existing,
	tournaments,
	allowedDocumentTypes,
	basePath = "/settings/documents",
	saveAction = saveDocumentAction,
	deleteAction = deleteDocumentAction,
	uploadAction = uploadDocumentFileAction,
}: DocumentFormProps) {
	const typeList = allowedDocumentTypes ?? baseDocumentTypes
	const documentTypes =
		existing && !typeList.includes(existing.documentType)
			? [...typeList, existing.documentType]
			: typeList
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
	const [source, setSource] = useState<FileSource | null>(null)
	const [librarySource, setLibrarySource] = useState<CurrentLibrarySource | null>(null)
	const [existingFile, setExistingFile] = useState<string | null>(existing?.file ?? null)

	// Which library file (if any) this document was published from.
	const existingId = existing?.id
	useEffect(() => {
		if (existingId === undefined) return
		let cancelled = false
		getDocumentSourceAction(existingId).then((result) => {
			if (!cancelled && result.success) setLibrarySource(result.data ?? null)
		})
		return () => {
			cancelled = true
		}
	}, [existingId])

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

			const result = await saveAction({
				id: existing?.id,
				title: title.trim(),
				documentType,
				year: yearNum,
				tournamentId,
			})

			if (result.success && result.data) {
				const docId = result.data.id

				if (source?.kind === "upload") {
					const formData = new FormData()
					formData.append("file", source.file)
					formData.append("documentId", docId.toString())
					const uploadResult = await uploadAction(formData)
					if (uploadResult.success && uploadResult.data) {
						setExistingFile(uploadResult.data.file)
						setLibrarySource(null)
						setSource(null)
					} else {
						toast.error(uploadResult.error ?? "Document saved but file upload failed")
					}
				} else if (source?.kind === "library") {
					const published = await publishToDocumentAction(docId, source.file.fileId)
					if (published.success && published.data) {
						setExistingFile(published.data.file)
						setLibrarySource({
							fileId: source.file.fileId,
							fileName: source.file.name,
							versionNo: published.data.versionNo,
							isCurrent: true,
						})
						setSource(null)
					} else {
						toast.error(published.error ?? "Document saved but the library file wasn't published")
					}
				}

				if (existing) {
					toast.success("Document updated")
				} else {
					toast.success("Document created")
					router.push(`${basePath}/${docId}`)
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
			const result = await deleteAction(existing.id)
			if (result.success) {
				toast.success("Document deleted")
				router.push(basePath)
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
		router.push(basePath)
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
						<DocumentFileSource value={source} onChange={setSource} current={librarySource} />
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
