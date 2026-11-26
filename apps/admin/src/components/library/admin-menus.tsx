"use client"

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	toast,
} from "@mpga/ui"
import { FolderInput, Lock, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import {
	deleteFileAction,
	deleteFolderAction,
	moveFileAction,
	moveFolderAction,
	renameFileAction,
	renameFolderAction,
} from "@/app/(dashboard)/library/actions"
import { descendantFolderIds } from "@/lib/library/access"
import { fileExtension } from "@/lib/library/file-types"
import { folderHref } from "@/lib/library/links"
import { MAX_FILE_NAME, MAX_FOLDER_DEPTH, MAX_FOLDER_NAME } from "@/lib/library/names"
import type { FolderSummary } from "@/lib/library/service"

import { DeleteDialog, MoveDialog, RenameDialog, RestrictDialog } from "./admin-dialogs"
import { folderDepths } from "./folder-picker"

type Open = null | "rename" | "move" | "restrict" | "delete"

function MenuTrigger({ label }: { label: string }) {
	return (
		<DropdownMenuTrigger asChild>
			<Button variant="outline" size="icon" aria-label={label}>
				<MoreHorizontal className="h-4 w-4" />
			</Button>
		</DropdownMenuTrigger>
	)
}

export function FolderMenu({ folder, tree }: { folder: FolderSummary; tree: FolderSummary[] }) {
	const router = useRouter()
	const [open, setOpen] = useState<Open>(null)
	const dialog = (name: Open) => ({
		open: open === name,
		onOpenChange: (next: boolean) => setOpen(next ? name : null),
	})

	// A folder can't go inside itself, below itself, or anywhere that would nest past the limit.
	const { disabled, topLevelOk } = useMemo(() => {
		const nodes = tree.map((f) => ({ ...f, deletedAt: null }))
		const depths = folderDepths(tree)
		const subtree = descendantFolderIds(nodes, folder.id)
		const ownDepth = depths.get(folder.id) ?? 1
		const height = Math.max(0, ...[...subtree].map((id) => (depths.get(id) ?? 1) - ownDepth))
		const reasons = new Map<number, string>()
		for (const f of tree) {
			if (subtree.has(f.id)) reasons.set(f.id, "A folder can't be moved inside itself")
			else if ((depths.get(f.id) ?? 1) + 1 + height > MAX_FOLDER_DEPTH)
				reasons.set(f.id, `Folders can be nested up to ${MAX_FOLDER_DEPTH} levels`)
		}
		return { disabled: reasons, topLevelOk: true }
	}, [tree, folder.id])

	return (
		<>
			<DropdownMenu>
				<MenuTrigger label={`Folder actions for ${folder.name}`} />
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => setOpen("rename")}>
						<Pencil className="h-4 w-4" /> Rename
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setOpen("move")}>
						<FolderInput className="h-4 w-4" /> Move
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setOpen("restrict")}>
						<Lock className="h-4 w-4" /> Restrict access
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={() => setOpen("delete")}
						className="text-red-600 focus:text-red-600"
					>
						<Trash2 className="h-4 w-4" /> Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<RenameDialog
				{...dialog("rename")}
				onDone={() => router.refresh()}
				title="Rename folder"
				initialName={folder.name}
				maxLength={MAX_FOLDER_NAME}
				save={(name) => renameFolderAction(folder.id, name)}
			/>
			<MoveDialog
				{...dialog("move")}
				onDone={() => {
					toast.success(`Moved ${folder.name}`)
					router.refresh()
				}}
				itemName={folder.name}
				folders={tree}
				currentParentId={folder.parentId}
				allowTopLevel={topLevelOk}
				disabled={disabled}
				move={(target) => moveFolderAction(folder.id, target)}
			/>
			<RestrictDialog
				{...dialog("restrict")}
				onDone={() => {
					toast.success("Access updated")
					router.refresh()
				}}
				folderId={folder.id}
				folderName={folder.name}
			/>
			<DeleteDialog
				{...dialog("delete")}
				onDone={() => {
					toast.success(`${folder.name} moved to Trash`)
					router.push(folderHref(folder.parentId))
				}}
				title={`Delete ${folder.name}?`}
				description="The folder and everything in it move to Trash. A document admin can restore them."
				remove={() => deleteFolderAction(folder.id)}
			/>
		</>
	)
}

export function FileMenu({
	file,
	tree,
}: {
	file: { id: number; name: string; folderId: number }
	tree: FolderSummary[]
}) {
	const router = useRouter()
	const [open, setOpen] = useState<Open>(null)
	const dialog = (name: Open) => ({
		open: open === name,
		onOpenChange: (next: boolean) => setOpen(next ? name : null),
	})
	const ext = fileExtension(file.name)

	return (
		<>
			<DropdownMenu>
				<MenuTrigger label={`File actions for ${file.name}`} />
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => setOpen("rename")}>
						<Pencil className="h-4 w-4" /> Rename
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setOpen("move")}>
						<FolderInput className="h-4 w-4" /> Move
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={() => setOpen("delete")}
						className="text-red-600 focus:text-red-600"
					>
						<Trash2 className="h-4 w-4" /> Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<RenameDialog
				{...dialog("rename")}
				onDone={() => router.refresh()}
				title="Rename file"
				initialName={file.name}
				maxLength={MAX_FILE_NAME}
				hint={ext ? `Keep the .${ext} extension.` : undefined}
				save={(name) => renameFileAction(file.id, name)}
			/>
			<MoveDialog
				{...dialog("move")}
				onDone={() => {
					toast.success(`Moved ${file.name}`)
					router.refresh()
				}}
				itemName={file.name}
				folders={tree}
				currentParentId={file.folderId}
				allowTopLevel={false}
				disabled={new Map()}
				move={(target) =>
					target === null
						? Promise.resolve({ success: false, error: "Choose a folder." })
						: moveFileAction(file.id, target)
				}
			/>
			<DeleteDialog
				{...dialog("delete")}
				onDone={() => {
					toast.success(`${file.name} moved to Trash`)
					router.push(folderHref(file.folderId))
				}}
				title={`Delete ${file.name}?`}
				description="The file and its versions move to Trash. A document admin can restore it."
				remove={() => deleteFileAction(file.id)}
			/>
		</>
	)
}
