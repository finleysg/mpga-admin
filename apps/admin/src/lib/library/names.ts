export const MAX_FOLDER_DEPTH = 4
export const MAX_FOLDER_NAME = 120
export const MAX_FILE_NAME = 200

/** Trim, collapse whitespace and strip characters that break paths or headers. */
export function cleanName(raw: string): string {
	return raw
		.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
}

export function validateName(
	raw: string,
	max: number,
): { ok: true; name: string } | { ok: false; error: string } {
	const name = cleanName(raw)
	if (!name || name === "." || name === "..") return { ok: false, error: "Enter a name." }
	if (name.length > max) return { ok: false, error: `Names can be up to ${max} characters.` }
	return { ok: true, name }
}

/**
 * Approximates the name columns' collation, utf8mb4_0900_ai_ci, which ignores case and accents
 * ("Resume.pdf" = "résumé.PDF"). The database's unique index is the final word; server code
 * looks up existing names with SQL equality where it needs an exact answer.
 */
function sameName(a: string, b: string): boolean {
	return a.localeCompare(b, undefined, { sensitivity: "base" }) === 0
}

export function nameTaken(name: string, existing: readonly string[]): boolean {
	return existing.some((n) => sameName(n, name))
}

/**
 * "Minutes.pdf" -> "Minutes (2).pdf", "Minutes (3).pdf", ... until it's free. The stem is
 * shortened when needed so the result, suffix and extension included, fits in `max` characters.
 */
export function uniqueName(name: string, existing: readonly string[], max = MAX_FILE_NAME): string {
	if (!nameTaken(name, existing)) return name
	const dot = name.lastIndexOf(".")
	const hasExt = dot > 0
	// Work in code points so truncation never splits an emoji or other surrogate pair.
	const base = Array.from(hasExt ? name.slice(0, dot) : name)
	const ext = hasExt ? name.slice(dot) : ""
	for (let n = 2; ; n++) {
		const suffix = ` (${n})${ext}`
		const room = Math.max(1, max - Array.from(suffix).length)
		const candidate = `${base.slice(0, room).join("").trimEnd()}${suffix}`
		if (!nameTaken(candidate, existing)) return candidate
	}
}
