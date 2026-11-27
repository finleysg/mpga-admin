"use client"

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	EmptyState,
	FieldError,
	cn,
} from "@mpga/ui"
import { AlertTriangle, ChevronRight, Folder, Library, Loader2, Lock } from "lucide-react"
import { useEffect, useState } from "react"

import { pickerFolderAction } from "@/app/(dashboard)/library/actions"
import { formatBytes } from "@/lib/library/file-types"
import type { FileSummary, FolderView } from "@/lib/library/service"

import { FileIcon } from "./file-icon"

export interface PickedFile {
	fileId: number
	name: string
	/** Inside a restricted folder: publishing makes it public, so we confirm first. */
	restricted: boolean
}

interface LibraryPickerProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onPick: (file: PickedFile) => void
}

/** Browse the library and choose a file to publish. The current version is used. */
export function LibraryPicker({ open, onOpenChange, onPick }: LibraryPickerProps) {
	const [folderId, setFolderId] = useState<number | null>(null)
	const [view, setView] = useState<FolderView | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [confirming, setConfirming] = useState<PickedFile | null>(null)

	useEffect(() => {
		if (!open) return
		let cancelled = false
		pickerFolderAction(folderId).then((result) => {
			if (cancelled) return
			if (result.success && result.data) {
				setView(result.data)
				setError(null)
			} else {
				setError(result.error ?? "Couldn't load the library.")
			}
		})
		return () => {
			cancelled = true
		}
	}, [open, folderId])

	const restrictedHere = view?.path.some((f) => f.isRestricted) ?? false

	function choose(file: FileSummary) {
		const picked = { fileId: file.id, name: file.name, restricted: restrictedHere }
		if (picked.restricted) setConfirming(picked)
		else finish(picked)
	}

	function finish(picked: PickedFile) {
		onPick(picked)
		onOpenChange(false)
		setConfirming(null)
	}

	const crumbs = [{ id: null as number | null, name: "All folders" }, ...(view?.path ?? [])]

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next)
				if (!next) setConfirming(null)
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-heading text-secondary-500">Choose from library</DialogTitle>
					<DialogDescription>
						The file&apos;s current version is published. Later versions don&apos;t change the
						public copy until you re-publish.
					</DialogDescription>
				</DialogHeader>

				{confirming ? (
					<div className="space-y-3">
						<p className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
							<span>
								<strong>{confirming.name}</strong> is in a restricted folder. Publishing puts a copy
								on the public website where anyone can see it.
							</span>
						</p>
						<DialogFooter>
							<Button variant="outline" onClick={() => setConfirming(null)}>
								Back
							</Button>
							<Button onClick={() => finish(confirming)}>Publish anyway</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="space-y-3">
						<nav
							aria-label="Library location"
							className="flex flex-wrap items-center gap-1 text-sm"
						>
							{crumbs.map((c, i) => (
								<span key={c.id ?? "root"} className="flex items-center gap-1">
									{i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden />}
									<button
										type="button"
										onClick={() => setFolderId(c.id)}
										className={cn(
											"rounded px-1 hover:underline",
											i === crumbs.length - 1 && "font-medium",
										)}
									>
										{c.name}
									</button>
								</span>
							))}
						</nav>
						{error && <FieldError>{error}</FieldError>}
						{!view ? (
							<div className="flex justify-center py-8">
								<Loader2
									className="h-5 w-5 animate-spin text-muted-foreground"
									aria-label="Loading"
								/>
							</div>
						) : view.subfolders.length === 0 && view.files.length === 0 ? (
							<EmptyState message="Nothing here yet." />
						) : (
							<ul className="max-h-80 divide-y overflow-y-auto rounded-md border">
								{view.subfolders.map((f) => (
									<li key={`folder-${f.id}`}>
										<button
											type="button"
											onClick={() => setFolderId(f.id)}
											className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
										>
											<Folder className="h-4 w-4 shrink-0 text-secondary-500" aria-hidden />
											<span className="flex-1 truncate">{f.name}</span>
											{f.isRestricted && (
												<Lock className="h-3.5 w-3.5 text-amber-600" aria-label="Restricted" />
											)}
											<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
										</button>
									</li>
								))}
								{view.files.map((f) => (
									<li key={`file-${f.id}`}>
										<button
											type="button"
											onClick={() => choose(f)}
											className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
										>
											<FileIcon name={f.name} className="h-4 w-4" />
											<span className="flex-1 truncate">{f.name}</span>
											<span className="shrink-0 text-xs text-muted-foreground">
												{formatBytes(f.size)}
												{f.versionCount > 1 && ` · v${f.versionCount}`}
											</span>
										</button>
									</li>
								))}
							</ul>
						)}
						{folderId === null && view && (
							<p className="flex items-center gap-1 text-xs text-muted-foreground">
								<Library className="h-3 w-3" aria-hidden /> Open a folder to choose a file.
							</p>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
