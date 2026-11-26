"use client"

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldError,
	toast,
} from "@mpga/ui"
import { Loader2, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { restoreFromTrashAction } from "@/app/(dashboard)/library/actions"
import type { FolderSummary } from "@/lib/library/service"

import { FolderPicker } from "./folder-picker"

interface TrashRestoreProps {
	kind: "folder" | "file"
	id: number
	name: string
	parentIsLive: boolean
	folders: FolderSummary[]
}

/**
 * Restores in place when the original folder still exists. Otherwise asks where to put it:
 * folders may go to the top level, files need a folder.
 */
export function TrashRestore({ kind, id, name, parentIsLive, folders }: TrashRestoreProps) {
	const router = useRouter()
	const [busy, setBusy] = useState(false)
	const [choosing, setChoosing] = useState(false)
	const [target, setTarget] = useState<number | null | undefined>(
		kind === "folder" ? null : undefined,
	)
	const [error, setError] = useState<string | null>(null)

	async function restore(to?: number | null) {
		setBusy(true)
		setError(null)
		const result = await restoreFromTrashAction(kind, id, to)
		setBusy(false)
		if (!result.success || !result.data) {
			setError(result.error ?? "Couldn't restore.")
			if (!choosing) toast.error(result.error ?? "Couldn't restore.")
			return
		}
		setChoosing(false)
		toast.success(
			result.data.name === name ? `${name} restored` : `${name} restored as ${result.data.name}`,
		)
		router.refresh()
	}

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				disabled={busy}
				onClick={() => (parentIsLive ? restore() : setChoosing(true))}
			>
				{busy && !choosing ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<RotateCcw className="h-4 w-4" />
				)}
				Restore
			</Button>
			<Dialog open={choosing} onOpenChange={(next) => !busy && setChoosing(next)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="font-heading text-secondary-500">Restore {name}</DialogTitle>
						<DialogDescription>
							The folder it was in is also in Trash. Choose where to restore it
							{kind === "folder" ? ", or leave it at the top level" : ""}.
						</DialogDescription>
					</DialogHeader>
					<FolderPicker
						folders={folders}
						value={target}
						onChange={setTarget}
						allowTopLevel={kind === "folder"}
					/>
					{error && <FieldError>{error}</FieldError>}
					<DialogFooter>
						<Button onClick={() => restore(target)} disabled={busy || target === undefined}>
							{busy ? "Restoring…" : "Restore"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
