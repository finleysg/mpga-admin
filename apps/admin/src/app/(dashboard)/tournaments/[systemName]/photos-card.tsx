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
	ItemMedia,
	ItemTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@mpga/ui"
import { ImageIcon, Pencil, Plus, Trash2, Upload, X } from "lucide-react"
import { useRef, useState } from "react"

import { FileDropZone } from "@/components/file-drop-zone"
import type { PhotoData } from "@/lib/photos"

import { deletePhotoAction, savePhotoAction, uploadPhotoImageAction } from "./photo-actions"

const photoTypes = ["Committee", "Golf Course", "Tournament Winners", "Tournament Photos", "Other"]

interface PhotosCardProps {
	initialPhotos: PhotoData[]
	tournamentId: number
	year: number
	systemName: string
}

interface EditingPhoto {
	id?: number
	caption: string
	photoType: string
	file?: File
}

export function PhotosCard({ initialPhotos, tournamentId, year, systemName }: PhotosCardProps) {
	const [photos, setPhotos] = useState(initialPhotos)
	const [editing, setEditing] = useState<EditingPhoto | null>(null)
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState<number | null>(null)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [uploadTargetId, setUploadTargetId] = useState<number | null>(null)

	const handleAdd = () => {
		setEditing({ caption: "", photoType: "Tournament Photos" })
	}

	const handleEdit = (p: PhotoData) => {
		setEditing({ id: p.id, caption: p.caption, photoType: p.photoType })
	}

	const handleCancel = () => {
		setEditing(null)
	}

	const handleSave = async () => {
		if (!editing) return

		setSaving(true)
		try {
			const result = await savePhotoAction({
				id: editing.id,
				caption: editing.caption,
				photoType: editing.photoType,
				tournamentId,
				year,
				systemName,
			})

			if (result.success && result.data) {
				const photoId = result.data.id
				let rawImage = ""

				if (editing.file) {
					const formData = new FormData()
					formData.append("file", editing.file)
					formData.append("photoId", photoId.toString())
					formData.append("year", year.toString())
					formData.append("systemName", systemName)
					const uploadResult = await uploadPhotoImageAction(formData)
					if (uploadResult.success && uploadResult.data) {
						rawImage = uploadResult.data.rawImage
					} else {
						toast.error(uploadResult.error ?? "Photo saved but image upload failed")
					}
				}

				if (editing.id) {
					setPhotos((prev) =>
						prev.map((p) =>
							p.id === editing.id
								? {
										...p,
										caption: editing.caption,
										photoType: editing.photoType,
										...(rawImage ? { rawImage } : {}),
									}
								: p,
						),
					)
				} else {
					setPhotos((prev) => [
						...prev,
						{
							id: photoId,
							caption: editing.caption,
							photoType: editing.photoType,
							rawImage,
							year,
							tournamentId,
						},
					])
				}
				setEditing(null)
				toast.success(editing.id ? "Photo updated" : "Photo added")
			} else {
				toast.error(result.error ?? "Failed to save photo")
			}
		} catch {
			toast.error("Failed to save photo")
		} finally {
			setSaving(false)
		}
	}

	const handleUploadClick = (photoId: number) => {
		setUploadTargetId(photoId)
		fileInputRef.current?.click()
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || uploadTargetId === null) return

		const targetPhoto = photos.find((p) => p.id === uploadTargetId)
		if (!targetPhoto) return

		setUploading(uploadTargetId)
		try {
			const formData = new FormData()
			formData.append("file", file)
			formData.append("photoId", uploadTargetId.toString())
			formData.append("year", targetPhoto.year.toString())
			formData.append("systemName", systemName)

			const result = await uploadPhotoImageAction(formData)
			if (result.success && result.data) {
				setPhotos((prev) =>
					prev.map((p) =>
						p.id === uploadTargetId ? { ...p, rawImage: result.data!.rawImage } : p,
					),
				)
				toast.success("Image uploaded")
			} else {
				toast.error(result.error ?? "Failed to upload image")
			}
		} catch {
			toast.error("Failed to upload image")
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
			const result = await deletePhotoAction(deleteId, systemName)
			if (result.success) {
				setPhotos((prev) => prev.filter((p) => p.id !== deleteId))
				toast.success("Photo deleted")
			} else {
				toast.error(result.error ?? "Failed to delete photo")
			}
		} catch {
			toast.error("Failed to delete photo")
		} finally {
			setDeleteId(null)
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-heading">Photos</CardTitle>
				<Button variant="secondaryoutline" size="sm" onClick={handleAdd}>
					<Plus className="mr-1 h-4 w-4" />
					Add
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileChange}
				/>

				{editing && !editing.id && (
					<EditForm
						editing={editing}
						setEditing={setEditing}
						onSave={handleSave}
						onCancel={handleCancel}
						saving={saving}
					/>
				)}

				{photos.map((p) =>
					editing?.id === p.id ? (
						<EditForm
							key={p.id}
							editing={editing}
							setEditing={setEditing}
							onSave={handleSave}
							onCancel={handleCancel}
							saving={saving}
						/>
					) : (
						<Item key={p.id} variant="outline" size="sm">
							<ItemMedia>
								{p.rawImage ? (
									<img
										src={getMediaUrl(p.rawImage)}
										alt={p.caption}
										className="h-12 w-16 rounded object-cover"
									/>
								) : (
									<div className="flex h-12 w-16 items-center justify-center rounded bg-gray-100">
										<ImageIcon className="h-5 w-5 text-gray-400" />
									</div>
								)}
							</ItemMedia>
							<ItemContent>
								<ItemTitle>
									{p.caption}
									<Badge variant="secondary">{p.photoType}</Badge>
								</ItemTitle>
							</ItemContent>
							<ItemActions>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleUploadClick(p.id)}
									disabled={uploading === p.id}
								>
									<Upload className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</ItemActions>
						</Item>
					),
				)}

				{photos.length === 0 && !editing && (
					<p className="text-sm text-muted-foreground">No photos yet.</p>
				)}
			</CardContent>

			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Photo</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this photo? This action cannot be undone.
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
	editing: EditingPhoto
	setEditing: (e: EditingPhoto | null) => void
	onSave: () => void
	onCancel: () => void
	saving: boolean
}) {
	return (
		<div className="space-y-2 rounded-md border border-secondary-200 p-3">
			<Field>
				<FieldLabel htmlFor="photo-caption">Caption</FieldLabel>
				<Input
					id="photo-caption"
					value={editing.caption}
					onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
				/>
			</Field>
			<Field>
				<FieldLabel>Type</FieldLabel>
				<Select
					value={editing.photoType}
					onValueChange={(value) => setEditing({ ...editing, photoType: value })}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{photoTypes.map((t) => (
							<SelectItem key={t} value={t}>
								{t}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel>Image</FieldLabel>
				<FileDropZone
					file={editing.file}
					onFileChange={(file) => setEditing({ ...editing, file })}
					accept="image/*"
					placeholder="Drag and drop an image here, or click to browse"
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
