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
import { ExternalLink, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import {
	type DocumentData,
	type TournamentOption,
	deleteDocumentAction,
	saveDocumentAction,
	uploadDocumentFileAction,
} from "./actions"

const baseDocumentTypes = ["Tee Times", "Results", "Pairings", "Match Play", "Other"]

interface DocumentFormProps {
	document?: DocumentData
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
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [dragOver, setDragOver] = useState(false)

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
						<input
							ref={fileInputRef}
							type="file"
							className="hidden"
							onChange={(e) => {
								const f = e.target.files?.[0]
								setFile(f ?? undefined)
							}}
						/>
						<div
							role="button"
							tabIndex={0}
							className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed p-4 transition-colors ${
								dragOver
									? "border-secondary-500 bg-secondary-50"
									: "border-muted-foreground/25 hover:border-secondary-300"
							}`}
							onClick={() => fileInputRef.current?.click()}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault()
									fileInputRef.current?.click()
								}
							}}
							onDragOver={(e) => {
								e.preventDefault()
								setDragOver(true)
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={(e) => {
								e.preventDefault()
								setDragOver(false)
								const f = e.dataTransfer.files[0]
								if (f) {
									setFile(f)
								}
							}}
						>
							{file ? (
								<span className="text-sm text-foreground">{file.name}</span>
							) : (
								<>
									<Upload className="h-5 w-5 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										Drag and drop a file here, or click to browse
									</span>
								</>
							)}
						</div>
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
