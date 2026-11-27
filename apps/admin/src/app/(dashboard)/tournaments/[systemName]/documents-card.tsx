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
	Badge,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@mpga/ui"
import { ExternalLink, Pencil, Plus, Trash2, Upload, X } from "lucide-react"
import { useRef, useState } from "react"

import { publishToDocumentAction } from "@/app/(dashboard)/library/actions"
import { DocumentFileSource, type FileSource } from "@/components/library/document-file-source"
import { documentTypes } from "@/lib/document-types"
import type { DocumentData } from "@/lib/documents"

import {
	deleteDocumentAction,
	saveDocumentAction,
	uploadDocumentFileAction,
} from "./document-actions"

interface DocumentsCardProps {
	initialDocuments: DocumentData[]
	tournamentId: number
	year: number
	systemName: string
}

interface EditingDoc {
	id?: number
	title: string
	documentType: string
	source?: FileSource | null
}

export function DocumentsCard({
	initialDocuments,
	tournamentId,
	year,
	systemName,
}: DocumentsCardProps) {
	const [documents, setDocuments] = useState(initialDocuments)
	const [editing, setEditing] = useState<EditingDoc | null>(null)
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState<number | null>(null)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [uploadTargetId, setUploadTargetId] = useState<number | null>(null)

	const handleAdd = () => {
		setEditing({ title: "", documentType: "Other" })
	}

	const handleEdit = (doc: DocumentData) => {
		setEditing({ id: doc.id, title: doc.title, documentType: doc.documentType })
	}

	const handleCancel = () => {
		setEditing(null)
	}

	const handleSave = async () => {
		if (!editing) return

		setSaving(true)
		try {
			const result = await saveDocumentAction({
				id: editing.id,
				title: editing.title,
				documentType: editing.documentType,
				tournamentId,
				year,
				systemName,
			})

			if (result.success && result.data) {
				const docId = result.data.id
				let fileKey: string | null = null

				// Attach the chosen file: published from the library, or uploaded directly.
				if (editing.source?.kind === "upload") {
					const formData = new FormData()
					formData.append("file", editing.source.file)
					formData.append("documentId", docId.toString())
					formData.append("systemName", systemName)
					const uploadResult = await uploadDocumentFileAction(formData)
					if (uploadResult.success && uploadResult.data) {
						fileKey = uploadResult.data.file
					} else {
						toast.error(uploadResult.error ?? "Document saved but file upload failed")
					}
				} else if (editing.source?.kind === "library") {
					const published = await publishToDocumentAction(docId, editing.source.file.fileId)
					if (published.success && published.data) {
						fileKey = published.data.file
					} else {
						toast.error(published.error ?? "Document saved but the library file wasn't published")
					}
				}

				if (editing.id) {
					setDocuments((prev) =>
						prev.map((d) =>
							d.id === editing.id
								? {
										...d,
										title: editing.title,
										documentType: editing.documentType,
										...(fileKey ? { file: fileKey } : {}),
									}
								: d,
						),
					)
				} else {
					setDocuments((prev) => [
						...prev,
						{
							id: docId,
							title: editing.title,
							documentType: editing.documentType,
							file: fileKey,
							year,
							tournamentId,
						},
					])
				}
				setEditing(null)
				toast.success(editing.id ? "Document updated" : "Document added")
			} else {
				toast.error(result.error ?? "Failed to save document")
			}
		} catch {
			toast.error("Failed to save document")
		} finally {
			setSaving(false)
		}
	}

	const handleUploadClick = (docId: number) => {
		setUploadTargetId(docId)
		fileInputRef.current?.click()
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || uploadTargetId === null) return

		setUploading(uploadTargetId)
		try {
			const formData = new FormData()
			formData.append("file", file)
			formData.append("documentId", uploadTargetId.toString())
			formData.append("systemName", systemName)

			const result = await uploadDocumentFileAction(formData)
			if (result.success && result.data) {
				setDocuments((prev) =>
					prev.map((d) => (d.id === uploadTargetId ? { ...d, file: result.data!.file } : d)),
				)
				toast.success("File uploaded")
			} else {
				toast.error(result.error ?? "Failed to upload file")
			}
		} catch {
			toast.error("Failed to upload file")
		} finally {
			setUploading(null)
			setUploadTargetId(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}

	const handleDelete = async () => {
		if (deleteId === null) return

		try {
			const result = await deleteDocumentAction(deleteId, systemName)
			if (result.success) {
				setDocuments((prev) => prev.filter((d) => d.id !== deleteId))
				toast.success("Document deleted")
			} else {
				toast.error(result.error ?? "Failed to delete document")
			}
		} catch {
			toast.error("Failed to delete document")
		} finally {
			setDeleteId(null)
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-heading">Documents</CardTitle>
				<Button variant="secondaryoutline" size="sm" onClick={handleAdd}>
					<Plus className="mr-1 h-4 w-4" />
					Add
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				<input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

				{editing && !editing.id && (
					<EditForm
						editing={editing}
						setEditing={setEditing}
						onSave={handleSave}
						onCancel={handleCancel}
						saving={saving}
					/>
				)}

				{documents.map((doc) =>
					editing?.id === doc.id ? (
						<EditForm
							key={doc.id}
							editing={editing}
							setEditing={setEditing}
							onSave={handleSave}
							onCancel={handleCancel}
							saving={saving}
						/>
					) : (
						<Item key={doc.id} variant="outline" size="sm">
							<ItemContent>
								<ItemTitle>
									{doc.title}
									<Badge variant="secondary">{doc.documentType}</Badge>
								</ItemTitle>
								{doc.file && (
									<a
										href={getMediaUrl(doc.file)}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
									>
										<ExternalLink className="h-3 w-3" />
										View file
									</a>
								)}
							</ItemContent>
							<ItemActions>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleUploadClick(doc.id)}
									disabled={uploading === doc.id}
								>
									<Upload className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => handleEdit(doc)}>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => setDeleteId(doc.id)}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</ItemActions>
						</Item>
					),
				)}

				{documents.length === 0 && !editing && (
					<p className="text-sm text-muted-foreground">No documents yet.</p>
				)}
			</CardContent>

			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
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
	editing: EditingDoc
	setEditing: (e: EditingDoc | null) => void
	onSave: () => void
	onCancel: () => void
	saving: boolean
}) {
	return (
		<div className="space-y-2 rounded-md border border-secondary-200 p-3">
			<Field>
				<FieldLabel htmlFor="doc-title">Title</FieldLabel>
				<Input
					id="doc-title"
					value={editing.title}
					onChange={(e) => setEditing({ ...editing, title: e.target.value })}
				/>
			</Field>
			<Field>
				<FieldLabel>Type</FieldLabel>
				<Select
					value={editing.documentType}
					onValueChange={(value) => setEditing({ ...editing, documentType: value })}
				>
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
			</Field>
			<Field>
				<FieldLabel>File</FieldLabel>
				<DocumentFileSource
					value={editing.source ?? null}
					onChange={(source) => setEditing({ ...editing, source })}
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
