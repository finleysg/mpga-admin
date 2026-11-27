"use client"

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@mpga/ui"
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { uploadFileAction } from "@/app/(dashboard)/library/actions"
import {
	ACCEPT_ATTRIBUTE,
	checkFileBasics,
	formatBytes,
	MAX_FILE_BYTES,
} from "@/lib/library/file-types"
import type { UploadMode } from "@/lib/library/service"

import { FileIcon } from "./file-icon"

type Status = "ready" | "uploading" | "done" | "error" | "conflict"

interface Item {
	key: string
	file: File
	status: Status
	message?: string
}

let nextKey = 0

interface UploadDialogProps {
	folderId: number
	folderName: string
}

export function UploadDialog({ folderId, folderName }: UploadDialogProps) {
	const router = useRouter()
	const inputRef = useRef<HTMLInputElement>(null)
	const [open, setOpen] = useState(false)
	const [items, setItems] = useState<Item[]>([])
	const [dragOver, setDragOver] = useState(false)
	const [running, setRunning] = useState(false)
	const uploadedAny = useRef(false)

	function update(key: string, patch: Partial<Item>) {
		setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)))
	}

	function addFiles(list: FileList | null) {
		if (!list) return
		const added = Array.from(list).map((file): Item => {
			const problem = checkFileBasics(file.name, file.size)
			return {
				key: String(nextKey++),
				file,
				status: problem ? "error" : "ready",
				message: problem ?? undefined,
			}
		})
		setItems((prev) => [...prev, ...added])
	}

	async function send(item: Item, mode: UploadMode) {
		update(item.key, { status: "uploading", message: undefined })
		const form = new FormData()
		form.set("file", item.file)
		form.set("folderId", String(folderId))
		form.set("mode", mode)
		try {
			const result = await uploadFileAction(form)
			if (result.success) {
				uploadedAny.current = true
				const renamed = result.data && result.data.name !== item.file.name
				const asVersion = result.data && result.data.versionNo > 1
				update(item.key, {
					status: "done",
					message: asVersion
						? `Saved as version ${result.data!.versionNo}`
						: renamed
							? `Saved as ${result.data!.name}`
							: undefined,
				})
			} else if (result.conflict) {
				update(item.key, { status: "conflict", message: result.error })
			} else {
				update(item.key, { status: "error", message: result.error ?? "Upload failed" })
			}
		} catch {
			// Most often the request was larger than the server allows.
			update(item.key, { status: "error", message: "Upload failed. Check the file and try again." })
		}
	}

	async function uploadAll() {
		setRunning(true)
		// One at a time keeps each request under the size limit and the order predictable.
		for (const item of items.filter((i) => i.status === "ready")) {
			await send(item, "new")
		}
		setRunning(false)
		if (uploadedAny.current) router.refresh()
	}

	async function resolve(item: Item, mode: UploadMode) {
		await send(item, mode)
		if (uploadedAny.current) router.refresh()
	}

	function onOpenChange(next: boolean) {
		if (running) return
		setOpen(next)
		if (!next) {
			setItems([])
			uploadedAny.current = false
		}
	}

	const readyCount = items.filter((i) => i.status === "ready").length
	const allSettled =
		items.length > 0 && items.every((i) => i.status === "done" || i.status === "error")

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button>
					<Upload className="h-4 w-4" />
					Upload
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-heading text-secondary-500">Upload files</DialogTitle>
					<DialogDescription>
						To <span className="font-medium text-foreground">{folderName}</span>. Up to{" "}
						{formatBytes(MAX_FILE_BYTES)} each.
					</DialogDescription>
				</DialogHeader>

				<input
					ref={inputRef}
					type="file"
					multiple
					accept={ACCEPT_ATTRIBUTE}
					className="hidden"
					onChange={(e) => {
						addFiles(e.target.files)
						e.target.value = ""
					}}
				/>
				<button
					type="button"
					disabled={running}
					className={`flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors ${
						dragOver
							? "border-secondary-500 bg-secondary-50"
							: "border-muted-foreground/25 hover:border-secondary-300"
					}`}
					onClick={() => inputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault()
						setDragOver(true)
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={(e) => {
						e.preventDefault()
						setDragOver(false)
						addFiles(e.dataTransfer.files)
					}}
				>
					<Upload className="h-6 w-6 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						<span className="hidden sm:inline">Drag files here, or </span>
						<span className="font-medium text-secondary-600">choose files</span>
					</span>
				</button>

				{items.length > 0 && (
					<ul className="max-h-72 space-y-2 overflow-y-auto" aria-live="polite">
						{items.map((item) => (
							<li key={item.key} className="rounded-md border p-2 text-sm">
								<div className="flex items-center gap-2">
									<FileIcon name={item.file.name} className="h-4 w-4" />
									<span className="min-w-0 flex-1 truncate">{item.file.name}</span>
									<span className="shrink-0 text-xs text-muted-foreground">
										{formatBytes(item.file.size)}
									</span>
									<StatusIcon status={item.status} />
								</div>
								{item.message && (
									<p
										className={`mt-1 text-xs ${item.status === "error" ? "text-red-600" : "text-muted-foreground"}`}
									>
										{item.message}
									</p>
								)}
								{item.status === "conflict" && (
									<div className="mt-2 flex flex-wrap gap-2">
										<Button size="sm" onClick={() => resolve(item, "newVersion")}>
											Add as new version
										</Button>
										<Button size="sm" variant="outline" onClick={() => resolve(item, "keepBoth")}>
											Keep both
										</Button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>
						{allSettled ? "Done" : "Cancel"}
					</Button>
					<Button onClick={uploadAll} disabled={running || readyCount === 0}>
						{running ? "Uploading…" : `Upload${readyCount > 1 ? ` ${readyCount} files` : ""}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function StatusIcon({ status }: { status: Status }) {
	switch (status) {
		case "uploading":
			return (
				<Loader2
					className="h-4 w-4 shrink-0 animate-spin text-secondary-500"
					aria-label="Uploading"
				/>
			)
		case "done":
			return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Uploaded" />
		case "error":
		case "conflict":
			return (
				<AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-label="Needs attention" />
			)
		default:
			return null
	}
}
