"use client"

import { cn } from "@mpga/ui"
import { ChevronRight, Folder, FolderOpen, Library, Lock } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { folderHref } from "@/lib/library/links"
import type { FolderSummary } from "@/lib/library/service"

interface FolderTreeProps {
	folders: FolderSummary[]
	currentId: number | null
	/** Ancestors of the current folder start expanded. */
	openIds: number[]
}

export function FolderTree({ folders, currentId, openIds }: FolderTreeProps) {
	const children = useMemo(() => {
		const map = new Map<number | null, FolderSummary[]>()
		for (const f of folders) map.set(f.parentId, [...(map.get(f.parentId) ?? []), f])
		return map
	}, [folders])
	const [expanded, setExpanded] = useState<Set<number>>(() => new Set(openIds))
	// When the current folder changes, expand its ancestors (without collapsing anything else).
	const openKey = openIds.join(",")
	const [seenOpenKey, setSeenOpenKey] = useState(openKey)
	if (seenOpenKey !== openKey) {
		setSeenOpenKey(openKey)
		setExpanded((prev) => new Set([...prev, ...openIds]))
	}

	function toggle(id: number) {
		setExpanded((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	function renderLevel(parentId: number | null, depth: number) {
		const items = children.get(parentId)
		if (!items?.length) return null
		return (
			<ul className="space-y-0.5">
				{items.map((f) => {
					const hasChildren = (children.get(f.id)?.length ?? 0) > 0
					const isOpen = expanded.has(f.id)
					const isCurrent = f.id === currentId
					return (
						<li key={f.id}>
							<div
								className={cn(
									"flex items-center rounded-md text-sm",
									isCurrent ? "bg-secondary-100 font-medium text-secondary-700" : "hover:bg-muted",
								)}
								style={{ paddingLeft: depth * 12 }}
							>
								<button
									type="button"
									onClick={() => toggle(f.id)}
									className={cn("p-1 text-muted-foreground", !hasChildren && "invisible")}
									aria-label={`Show folders in ${f.name}`}
									aria-expanded={hasChildren ? isOpen : undefined}
									tabIndex={hasChildren ? 0 : -1}
								>
									<ChevronRight
										className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")}
									/>
								</button>
								<Link
									href={folderHref(f.id)}
									className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2"
									aria-current={isCurrent ? "page" : undefined}
								>
									{isCurrent ? (
										<FolderOpen className="h-4 w-4 shrink-0 text-secondary-500" />
									) : (
										<Folder className="h-4 w-4 shrink-0 text-secondary-500" />
									)}
									<span className="truncate">{f.name}</span>
									{f.isRestricted && (
										<Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-label="Restricted" />
									)}
								</Link>
							</div>
							{hasChildren && isOpen && renderLevel(f.id, depth + 1)}
						</li>
					)
				})}
			</ul>
		)
	}

	return (
		<nav aria-label="Folders" className="text-sm">
			<Link
				href={folderHref(null)}
				className={cn(
					"mb-1 flex items-center gap-2 rounded-md px-2 py-1.5",
					currentId === null ? "bg-secondary-100 font-medium text-secondary-700" : "hover:bg-muted",
				)}
				aria-current={currentId === null ? "page" : undefined}
			>
				<Library className="h-4 w-4 text-secondary-500" />
				All folders
			</Link>
			{renderLevel(null, 0)}
		</nav>
	)
}
