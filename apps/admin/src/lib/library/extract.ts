import { parseInWorker } from "./extract-worker"
import { fileExtension } from "./file-types"

/** Longest text kept per version for search (the column is MEDIUMTEXT). */
export const MAX_TEXT_CHARS = 1_000_000

function tidy(text: string): string {
	return text
		.replace(/\u0000/g, "")
		.replace(/[ \t\f\v]+/g, " ")
		.replace(/\s*\n\s*/g, "\n")
		.trim()
		.slice(0, MAX_TEXT_CHARS)
}

function plainText(bytes: Uint8Array): string {
	return new TextDecoder("utf-8").decode(bytes)
}

/**
 * Searchable text for a file, or null when the type isn't indexed (PowerPoint, legacy Office,
 * images) or nothing could be read (e.g. a scanned PDF with no text layer). Never throws:
 * search by name still works whatever happens here.
 */
export async function extractText(name: string, bytes: Uint8Array): Promise<string | null> {
	const ext = fileExtension(name)
	try {
		let text: string
		if (ext === "pdf" || ext === "docx" || ext === "xlsx") {
			// Binary formats are parsed in a worker that's killed if it runs too long or uses too
			// much memory (see extract-worker.ts).
			text = await parseInWorker(ext, bytes)
		} else if (ext === "txt" || ext === "csv" || ext === "md") {
			text = plainText(bytes)
		} else {
			return null
		}
		return tidy(text) || null
	} catch (error) {
		console.warn(`Couldn't extract text from ${name}:`, error)
		return null
	}
}
