import type { ContactData, DuplicateGroup } from "@/app/(dashboard)/members/contacts/actions"

/**
 * Pure duplicate-detection algorithm using Union-Find.
 * Three matching strategies:
 *   1. Exact full name match → LOW confidence
 *   2. Same email + shared first or last name → HIGH confidence
 *   3. Same phone (digits only) + shared first or last name → HIGH confidence
 *
 * Groups are sorted: HIGH confidence first, then by group size descending.
 */
export function findDuplicateGroups(contacts: ContactData[]): DuplicateGroup[] {
	// Union-Find
	const parent = new Map<number, number>()
	const rank = new Map<number, number>()
	const matchTypes = new Map<number, Set<string>>()
	const matchReasons = new Map<number, string[]>()

	function find(x: number): number {
		if (!parent.has(x)) {
			parent.set(x, x)
			rank.set(x, 0)
		}
		if (parent.get(x) !== x) {
			parent.set(x, find(parent.get(x)!))
		}
		return parent.get(x)!
	}

	function union(a: number, b: number, type: string, reason: string) {
		const ra = find(a)
		const rb = find(b)
		if (ra === rb) {
			matchTypes.get(ra)!.add(type)
			return
		}
		const rankA = rank.get(ra) ?? 0
		const rankB = rank.get(rb) ?? 0
		let newRoot: number
		let oldRoot: number
		if (rankA < rankB) {
			parent.set(ra, rb)
			newRoot = rb
			oldRoot = ra
		} else if (rankA > rankB) {
			parent.set(rb, ra)
			newRoot = ra
			oldRoot = rb
		} else {
			parent.set(rb, ra)
			rank.set(ra, rankA + 1)
			newRoot = ra
			oldRoot = rb
		}
		// Merge match info
		const newTypes = matchTypes.get(newRoot) ?? new Set<string>()
		const oldTypes = matchTypes.get(oldRoot) ?? new Set<string>()
		for (const t of oldTypes) newTypes.add(t)
		newTypes.add(type)
		matchTypes.set(newRoot, newTypes)
		const newReasons = matchReasons.get(newRoot) ?? []
		const oldReasons = matchReasons.get(oldRoot) ?? []
		matchReasons.set(newRoot, [...newReasons, ...oldReasons, reason])
	}

	// Build lookup maps
	const contactById = new Map<number, ContactData>()
	const emailMap = new Map<string, number[]>()
	const phoneMap = new Map<string, number[]>()
	const nameMap = new Map<string, number[]>()

	for (const c of contacts) {
		// Initialize Union-Find node
		find(c.id)
		matchTypes.set(find(c.id), new Set())
		matchReasons.set(find(c.id), [])

		contactById.set(c.id, c)

		if (c.email?.trim()) {
			const key = c.email.trim().toLowerCase()
			if (!emailMap.has(key)) emailMap.set(key, [])
			emailMap.get(key)!.push(c.id)
		}

		const phones = [c.primaryPhone, c.alternatePhone].filter(Boolean)
		for (const p of phones) {
			const digits = p!.replace(/\D/g, "")
			if (digits) {
				if (!phoneMap.has(digits)) phoneMap.set(digits, [])
				phoneMap.get(digits)!.push(c.id)
			}
		}

		const name = `${c.firstName} ${c.lastName}`.trim().toLowerCase()
		if (name) {
			if (!nameMap.has(name)) nameMap.set(name, [])
			nameMap.get(name)!.push(c.id)
		}
	}

	// Helper: do two contacts share a first or last name?
	function sharesNamePart(idA: number, idB: number): boolean {
		const a = contactById.get(idA)!
		const b = contactById.get(idB)!
		const aFirst = a.firstName.trim().toLowerCase()
		const bFirst = b.firstName.trim().toLowerCase()
		const aLast = a.lastName.trim().toLowerCase()
		const bLast = b.lastName.trim().toLowerCase()
		return (aFirst !== "" && aFirst === bFirst) || (aLast !== "" && aLast === bLast)
	}

	// Name matches: always union
	for (const [key, ids] of nameMap) {
		for (let i = 1; i < ids.length; i++) {
			union(ids[0]!, ids[i]!, "NAME", `Name: ${key}`)
		}
	}

	// Email matches: only union contacts that share a name part
	for (const [key, ids] of emailMap) {
		for (let i = 0; i < ids.length; i++) {
			for (let j = i + 1; j < ids.length; j++) {
				if (sharesNamePart(ids[i]!, ids[j]!)) {
					union(ids[i]!, ids[j]!, "EMAIL", `Email: ${key}`)
				}
			}
		}
	}

	// Phone matches: only union contacts that share a name part
	for (const [key, ids] of phoneMap) {
		for (let i = 0; i < ids.length; i++) {
			for (let j = i + 1; j < ids.length; j++) {
				if (sharesNamePart(ids[i]!, ids[j]!)) {
					union(ids[i]!, ids[j]!, "PHONE", `Phone: ${key}`)
				}
			}
		}
	}

	// Collect groups
	const groupMap = new Map<number, ContactData[]>()
	for (const c of contacts) {
		const root = find(c.id)
		if (!groupMap.has(root)) groupMap.set(root, [])
		groupMap.get(root)!.push(c)
	}

	const groups: DuplicateGroup[] = []
	for (const [root, members] of groupMap) {
		if (members.length < 2) continue
		const types = matchTypes.get(root) ?? new Set()
		const reasons = matchReasons.get(root) ?? []
		const confidence = types.has("EMAIL") || types.has("PHONE") ? "HIGH" : "LOW"
		const uniqueReasons = [...new Set(reasons)]
		groups.push({
			id: `group-${root}`,
			contacts: members,
			confidence,
			matchReason: uniqueReasons.join("; "),
		})
	}

	// Sort: HIGH first, then by group size descending
	groups.sort((a, b) => {
		if (a.confidence !== b.confidence) {
			return a.confidence === "HIGH" ? -1 : 1
		}
		return b.contacts.length - a.contacts.length
	})

	return groups
}
