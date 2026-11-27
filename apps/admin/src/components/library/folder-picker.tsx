"use client"

import { cn } from "@mpga/ui"
import { Check, Folder, Library, Lock } from "lucide-react"
import { useMemo } from "react"

import type { FolderSummary } from "@/lib/library/service"

interface FolderPickerProps {
	folders: FolderSummary[]
	value: number | null | undefined
	onChange: (id: number | null) => void
	/** Offer "Top level" (folders only; files must live in a folder). */
	allowTopLevel?: boolean
	/** Folders that can't be chosen, with the reason shown on hover. */
	disabled?: Map<number, string>
	topLevelDisabledReason?: string
}

/** Indented, scrollable list of folders to choose a destination from. */
export function FolderPicker({
	folders,
	value,
	onChange,
	allowTopLevel = false,
	disabled = new Map(),
	topLevelDisabledReason,
}: FolderPickerProps) {
	const ordered = useMemo(() => {
		const children = new Map<number | null, FolderSummary[]>()
		for (const f of folders) children.set(f.parentId, [...(children.get(f.parentId) ?? []), f])
		const out: { folder: FolderSummary; depth: number }[] = []
		const walk = (parentId: number | null, depth: number) => {
			for (const f of children.get(parentId) ?? []) {
				out.push({ folder: f, depth })
				walk(f.id, depth + 1)
			}
		}
		walk(null, 0)
		return out
	}, [folders])

	const option = (
		key: string,
		label: React.ReactNode,
		selected: boolean,
		reason: string | undefined,
		onSelect: () => void,
		indent = 0,
	) => (
		<li key={key}>
			<button
				type="button"
				role="radio"
				aria-checked={selected}
				disabled={!!reason}
				title={reason}
				onClick={onSelect}
				className={cn(
					"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
					selected ? "bg-secondary-100 font-medium text-secondary-700" : "hover:bg-muted",
					reason && "cursor-not-allowed opacity-50 hover:bg-transparent",
				)}
				style={{ paddingLeft: 8 + indent * 16 }}
			>
				{label}
				{selected && <Check className="ml-auto h-4 w-4" aria-hidden />}
			</button>
		</li>
	)

	return (
		<ul
			role="radiogroup"
			aria-label="Destination folder"
			className="max-h-72 overflow-y-auto rounded-md border p-1"
		>
			{allowTopLevel &&
				option(
					"top",
					<>
						<Library className="h-4 w-4 shrink-0 text-secondary-500" aria-hidden />
						Top level
					</>,
					value === null,
					topLevelDisabledReason,
					() => onChange(null),
				)}
			{ordered.map(({ folder, depth }) =>
				option(
					String(folder.id),
					<>
						<Folder className="h-4 w-4 shrink-0 text-secondary-500" aria-hidden />
						<span className="truncate">{folder.name}</span>
						{folder.isRestricted && (
							<Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-label="Restricted" />
						)}
					</>,
					value === folder.id,
					disabled.get(folder.id),
					() => onChange(folder.id),
					depth,
				),
			)}
		</ul>
	)
}

/** Depth (1 = top level) of each folder, from the parent links. */
export function folderDepths(folders: FolderSummary[]): Map<number, number> {
	const byId = new Map(folders.map((f) => [f.id, f]))
	const depths = new Map<number, number>()
	const depthOf = (id: number, guard = 0): number => {
		const known = depths.get(id)
		if (known !== undefined) return known
		const f = byId.get(id)
		const d = !f || f.parentId === null || guard > 10 ? 1 : depthOf(f.parentId, guard + 1) + 1
		depths.set(id, d)
		return d
	}
	for (const f of folders) depthOf(f.id)
	return depths
}
