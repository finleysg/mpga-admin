// Folder visibility rules, kept pure so they can be unit tested.

export interface FolderNode {
	id: number
	parentId: number | null
	isRestricted: boolean
	deletedAt: Date | null
}

export interface Viewer {
	id: string
	isDocumentAdmin: boolean
}

/**
 * Folder ids `viewer` can see. A restricted folder is visible only to its members, and a
 * folder is visible only if every restricted folder above it (and itself) includes the viewer.
 * Document admins see everything. Folders in Trash are excluded unless `includeDeleted`.
 */
export function visibleFolderIds(
	folders: readonly FolderNode[],
	memberships: ReadonlyMap<number, ReadonlySet<string>>,
	viewer: Viewer,
	{ includeDeleted = false } = {},
): Set<number> {
	const byId = new Map(folders.map((f) => [f.id, f]))
	const result = new Set<number>()
	const memo = new Map<number, boolean>()

	function visible(id: number, seen: Set<number>): boolean {
		const cached = memo.get(id)
		if (cached !== undefined) return cached
		const folder = byId.get(id)
		// Missing parents and cycles are treated as invisible rather than trusted.
		if (!folder || seen.has(id)) return false
		seen.add(id)
		let ok = includeDeleted || folder.deletedAt === null
		if (ok && !viewer.isDocumentAdmin && folder.isRestricted) {
			ok = memberships.get(id)?.has(viewer.id) ?? false
		}
		if (ok && folder.parentId !== null) ok = visible(folder.parentId, seen)
		memo.set(id, ok)
		return ok
	}

	for (const folder of folders) {
		if (visible(folder.id, new Set())) result.add(folder.id)
	}
	return result
}

/** Ids of `rootId` and every folder below it. */
export function descendantFolderIds(folders: readonly FolderNode[], rootId: number): Set<number> {
	const children = new Map<number, number[]>()
	for (const f of folders) {
		if (f.parentId === null) continue
		const list = children.get(f.parentId) ?? []
		list.push(f.id)
		children.set(f.parentId, list)
	}
	const result = new Set<number>()
	const stack = [rootId]
	while (stack.length) {
		const id = stack.pop()!
		if (result.has(id)) continue
		result.add(id)
		stack.push(...(children.get(id) ?? []))
	}
	return result
}

/**
 * Restricted folders that `itemParentId` sits inside today but would not after moving to
 * `targetParentId`. A non-empty result means the move may show the item to more people.
 * (A moved folder keeps its own restriction, so only ancestors matter.)
 */
export function restrictionsLostByMove<T extends FolderNode>(
	folders: readonly T[],
	itemParentId: number | null,
	targetParentId: number | null,
): T[] {
	const before = itemParentId === null ? [] : folderPath(folders, itemParentId)
	const after = new Set(
		targetParentId === null ? [] : folderPath(folders, targetParentId).map((f) => f.id),
	)
	return before.filter((f) => f.isRestricted && !after.has(f.id))
}

/** Levels below `rootId` (0 when it has no subfolders). */
export function subtreeHeight(
	folders: readonly (FolderNode & { depth: number })[],
	rootId: number,
): number {
	const ids = descendantFolderIds(folders, rootId)
	const root = folders.find((f) => f.id === rootId)
	if (!root) return 0
	return Math.max(0, ...folders.filter((f) => ids.has(f.id)).map((f) => f.depth - root.depth))
}

/** Ancestor chain from the top-level folder down to `id` (inclusive). */
export function folderPath<T extends FolderNode>(folders: readonly T[], id: number): T[] {
	const byId = new Map(folders.map((f) => [f.id, f]))
	const path: T[] = []
	const seen = new Set<number>()
	let current = byId.get(id)
	while (current && !seen.has(current.id)) {
		seen.add(current.id)
		path.unshift(current)
		current = current.parentId === null ? undefined : byId.get(current.parentId)
	}
	return path
}
