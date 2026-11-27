// Client-safe helper: split text into plain and highlighted parts for search results.

export interface HighlightPart {
	text: string
	match: boolean
}

/** Lower-case and strip accents, keeping one entry per original UTF-16 unit. */
function foldWithMap(text: string): { folded: string; map: number[] } {
	let folded = ""
	const map: number[] = []
	for (let i = 0; i < text.length; i++) {
		const base = text[i]!.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
		for (const ch of base) {
			folded += ch
			map.push(i)
		}
	}
	return { folded, map }
}

function fold(text: string): string {
	return foldWithMap(text).folded
}

/**
 * Mark every occurrence of any term, ignoring case and accents like the database does
 * ("resume" highlights "Résumé").
 */
export function highlight(text: string, terms: readonly string[]): HighlightPart[] {
	const { folded, map } = foldWithMap(text)
	const ranges: [number, number][] = []
	for (const term of terms.map(fold).filter(Boolean)) {
		let from = 0
		for (let at = folded.indexOf(term, from); at >= 0; at = folded.indexOf(term, from)) {
			const start = map[at]!
			const end = map[at + term.length - 1]! + 1
			ranges.push([start, end])
			from = at + term.length
		}
	}
	if (ranges.length === 0) return [{ text, match: false }]
	ranges.sort((a, b) => a[0] - b[0])
	const merged: [number, number][] = []
	for (const r of ranges) {
		const last = merged.at(-1)
		if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
		else merged.push([...r])
	}
	const parts: HighlightPart[] = []
	let pos = 0
	for (const [start, end] of merged) {
		if (start > pos) parts.push({ text: text.slice(pos, start), match: false })
		parts.push({ text: text.slice(start, end), match: true })
		pos = end
	}
	if (pos < text.length) parts.push({ text: text.slice(pos), match: false })
	return parts
}
