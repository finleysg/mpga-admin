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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	FieldError,
	toast,
} from "@mpga/ui"
import { Download, History, Loader2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
	getDownloadUrlAction,
	restoreVersionAction,
	uploadVersionAction,
} from "@/app/(dashboard)/library/actions"
import { FileDropZone } from "@/components/file-drop-zone"
import {
	checkFileBasics,
	fileExtension,
	formatBytes,
	MAX_FILE_BYTES,
} from "@/lib/library/file-types"

/** Fetches a fresh short-lived link at click time, so it never expires before use. */
export function DownloadButton({
	versionId,
	label = "Download",
	variant = "default",
	size = "default",
}: {
	versionId: number
	label?: string
	variant?: "default" | "outline" | "ghost" | "link"
	size?: "default" | "sm"
}) {
	const [busy, setBusy] = useState(false)

	async function download() {
		setBusy(true)
		const result = await getDownloadUrlAction(versionId)
		setBusy(false)
		if (result.success && result.data) {
			window.location.assign(result.data.url)
		} else {
			toast.error(result.error ?? "The file couldn't be downloaded.")
		}
	}

	return (
		<Button variant={variant} size={size} onClick={download} disabled={busy}>
			{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
			{label}
		</Button>
	)
}

export function UploadVersionDialog({ fileId, fileName }: { fileId: number; fileName: string }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [file, setFile] = useState<File>()
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const ext = fileExtension(fileName)

	function choose(f: File | undefined) {
		setFile(f)
		setError(null)
		if (!f) return
		if (fileExtension(f.name) !== ext) {
			setError(`Choose a .${ext} file, like the original.`)
		} else {
			setError(checkFileBasics(f.name, f.size))
		}
	}

	async function submit() {
		if (!file) return
		setSaving(true)
		const form = new FormData()
		form.set("file", file)
		form.set("fileId", String(fileId))
		try {
			const result = await uploadVersionAction(form)
			if (result.success && result.data) {
				toast.success(`Version ${result.data.versionNo} uploaded`)
				setOpen(false)
				setFile(undefined)
				router.refresh()
			} else {
				setError(result.error ?? "Upload failed.")
			}
		} catch {
			setError("Upload failed. Check the file and try again.")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (saving) return
				setOpen(next)
				if (!next) {
					setFile(undefined)
					setError(null)
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline">
					<Upload className="h-4 w-4" />
					Upload new version
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-heading text-secondary-500">Upload new version</DialogTitle>
					<DialogDescription>
						Earlier versions of {fileName} are kept. Up to {formatBytes(MAX_FILE_BYTES)}.
					</DialogDescription>
				</DialogHeader>
				<FileDropZone file={file} onFileChange={choose} accept={`.${ext}`} />
				{error && <FieldError>{error}</FieldError>}
				<DialogFooter>
					<Button onClick={submit} disabled={!file || !!error || saving}>
						{saving ? "Uploading…" : "Upload"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/** Document admins: make an earlier version current again (adds a new version). */
export function RestoreVersionButton({
	fileId,
	versionId,
	versionNo,
}: {
	fileId: number
	versionId: number
	versionNo: number
}) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [busy, setBusy] = useState(false)

	async function restore(e: React.MouseEvent) {
		e.preventDefault()
		setBusy(true)
		const result = await restoreVersionAction(fileId, versionId)
		setBusy(false)
		setOpen(false)
		if (result.success && result.data) {
			toast.success(`v${versionNo} restored as v${result.data.versionNo}`)
			router.refresh()
		} else {
			toast.error(result.error ?? "Couldn't restore that version.")
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" size="sm">
					<History className="h-4 w-4" />
					Restore
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="font-heading text-secondary-500">
						Restore v{versionNo}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						It becomes the current version, added as a new version. Nothing is deleted.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={restore} disabled={busy}>
						{busy ? "Restoring…" : "Restore"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
