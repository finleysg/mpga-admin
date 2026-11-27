"use client"

import { Button, FieldError, cn } from "@mpga/ui"
import { AlertTriangle, Library, Upload } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { FileDropZone } from "@/components/file-drop-zone"
import { formatBytes, MAX_FILE_BYTES } from "@/lib/library/file-types"
import { fileHref } from "@/lib/library/links"

import { FileIcon } from "./file-icon"
import { LibraryPicker, type PickedFile } from "./library-picker"

/** Where a document's file comes from when it's saved. */
export type FileSource = { kind: "library"; file: PickedFile } | { kind: "upload"; file: File }

export interface CurrentLibrarySource {
	fileId: number
	fileName: string
	versionNo: number
	isCurrent: boolean
}

interface DocumentFileSourceProps {
	value: FileSource | null
	onChange: (value: FileSource | null) => void
	/** The library file this document was published from, if any. */
	current?: CurrentLibrarySource | null
}

/**
 * File picker for public documents. Defaults to choosing a file from the library (published as a
 * snapshot); "Upload new" keeps the old direct-upload path.
 */
export function DocumentFileSource({ value, onChange, current }: DocumentFileSourceProps) {
	const [mode, setMode] = useState<"library" | "upload">(value?.kind ?? "library")
	const [pickerOpen, setPickerOpen] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function switchTo(next: "library" | "upload") {
		setMode(next)
		setError(null)
		if (value && value.kind !== next) onChange(null)
	}

	function chooseUpload(file: File | undefined) {
		setError(null)
		if (!file) return onChange(null)
		if (file.size > MAX_FILE_BYTES) {
			setError(
				`${file.name} is ${formatBytes(file.size)}. Files can be up to ${formatBytes(MAX_FILE_BYTES)}.`,
			)
			return onChange(null)
		}
		onChange({ kind: "upload", file })
	}

	return (
		<div className="space-y-2">
			<div
				role="tablist"
				aria-label="File source"
				className="inline-flex rounded-md border p-0.5 text-sm"
			>
				{(
					[
						["library", "Choose from library", Library],
						["upload", "Upload new", Upload],
					] as const
				).map(([key, label, Icon]) => (
					<button
						key={key}
						type="button"
						role="tab"
						aria-selected={mode === key}
						onClick={() => switchTo(key)}
						className={cn(
							"flex items-center gap-1.5 rounded px-3 py-1.5",
							mode === key ? "bg-secondary-100 font-medium text-secondary-700" : "hover:bg-muted",
						)}
					>
						<Icon className="h-4 w-4" aria-hidden />
						{label}
					</button>
				))}
			</div>

			{current && (
				<p className="text-xs text-muted-foreground">
					Published from library:{" "}
					<Link href={fileHref(current.fileId)} className="text-primary hover:underline">
						{current.fileName}
					</Link>{" "}
					v{current.versionNo}
					{!current.isCurrent && (
						<span className="ml-1 inline-flex items-center gap-1 text-amber-700">
							<AlertTriangle className="h-3 w-3" aria-hidden />a newer version exists
						</span>
					)}
				</p>
			)}

			{mode === "library" ? (
				<div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-3">
					{value?.kind === "library" ? (
						<span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
							<FileIcon name={value.file.name} className="h-4 w-4" />
							<span className="truncate">{value.file.name}</span>
							{value.file.restricted && (
								<span className="text-xs text-amber-700">(from a restricted folder)</span>
							)}
						</span>
					) : (
						<span className="flex-1 text-sm text-muted-foreground">
							{current ? "Choose a file to replace it." : "No file chosen."}
						</span>
					)}
					<Button
						type="button"
						variant="secondaryoutline"
						size="sm"
						onClick={() => setPickerOpen(true)}
					>
						{value?.kind === "library" ? "Change" : "Choose file"}
					</Button>
				</div>
			) : (
				<FileDropZone
					file={value?.kind === "upload" ? value.file : undefined}
					onFileChange={chooseUpload}
				/>
			)}
			{error && <FieldError>{error}</FieldError>}

			<LibraryPicker
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				onPick={(file) => onChange({ kind: "library", file })}
			/>
		</div>
	)
}
