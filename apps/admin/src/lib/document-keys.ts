/** `document.file` is VARCHAR(200): every key stored there must fit. */
export const DOCUMENT_FILE_MAX = 200

/**
 * `prefix` + a URL-safe version of `fileName`, shortened to fit `max` characters. The prefix
 * (which carries the uniqueness) and the extension are always kept; the name before the
 * extension is cut. Unsafe characters become "_", so the result is plain ASCII.
 */
export function documentKey(prefix: string, fileName: string, max = DOCUMENT_FILE_MAX): string {
	const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "file"
	const room = max - prefix.length
	if (room < 2) throw new Error(`Key prefix is too long: ${prefix}`)
	if (safe.length <= room) return prefix + safe
	const dot = safe.lastIndexOf(".")
	// Treat a short trailing ".xxx" as the extension; anything longer is just part of the name.
	const ext = dot > 0 && safe.length - dot <= 10 ? safe.slice(dot) : ""
	return prefix + safe.slice(0, Math.max(1, room - ext.length)) + ext
}
