import { fileExtension } from "./file-types"

/** Longest text kept per version for search (the column is MEDIUMTEXT). */
export const MAX_TEXT_CHARS = 1_000_000

/** Give up on a single file after this long; it stays searchable by name. */
const EXTRACT_TIMEOUT_MS = 20_000

function tidy(text: string): string {
	return text
		.replace(/\u0000/g, "")
		.replace(/[ \t\f\v]+/g, " ")
		.replace(/\s*\n\s*/g, "\n")
		.trim()
		.slice(0, MAX_TEXT_CHARS)
}

async function pdfText(bytes: Uint8Array): Promise<string> {
	const { extractText, getDocumentProxy } = await import("unpdf")
	// pdf.js may detach the buffer it's given, so hand it a copy.
	const pdf = await getDocumentProxy(bytes.slice())
	try {
		const { text } = await extractText(pdf, { mergePages: true })
		return text
	} finally {
		await pdf.loadingTask.destroy()
	}
}

async function docxText(bytes: Uint8Array): Promise<string> {
	const mammoth = await import("mammoth")
	const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
	return value
}

function cellText(value: unknown): string {
	if (value === null || value === undefined) return ""
	if (value instanceof Date) return value.toISOString().slice(0, 10)
	if (typeof value !== "object") return String(value)
	const v = value as {
		text?: unknown
		richText?: { text: string }[]
		result?: unknown
		hyperlink?: string
	}
	if (v.richText) return v.richText.map((r) => r.text).join("")
	if (v.text !== undefined) return cellText(v.text)
	if (v.result !== undefined) return cellText(v.result)
	return ""
}

async function xlsxText(bytes: Uint8Array): Promise<string> {
	const ExcelJS = (await import("exceljs")).default
	const workbook = new ExcelJS.Workbook()
	await workbook.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer)
	const lines: string[] = []
	workbook.eachSheet((sheet) => {
		lines.push(sheet.name)
		sheet.eachRow((row) => {
			const cells: string[] = []
			row.eachCell((cell) => {
				const text = cellText(cell.value).trim()
				if (text) cells.push(text)
			})
			if (cells.length) lines.push(cells.join(" "))
		})
	})
	return lines.join("\n")
}

function plainText(bytes: Uint8Array): string {
	return new TextDecoder("utf-8").decode(bytes)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`Text extraction took longer than ${ms} ms`)), ms)
	})
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Searchable text for a file, or null when the type isn't indexed (PowerPoint, legacy Office,
 * images) or nothing could be read (e.g. a scanned PDF with no text layer). Never throws:
 * search by name still works whatever happens here.
 */
export async function extractText(name: string, bytes: Uint8Array): Promise<string | null> {
	const ext = fileExtension(name)
	const extractor: Record<string, (b: Uint8Array) => Promise<string> | string> = {
		pdf: pdfText,
		docx: docxText,
		xlsx: xlsxText,
		txt: plainText,
		csv: plainText,
		md: plainText,
	}
	const run = extractor[ext]
	if (!run) return null
	try {
		const text = tidy(await withTimeout(Promise.resolve(run(bytes)), EXTRACT_TIMEOUT_MS))
		return text || null
	} catch (error) {
		console.warn(`Couldn't extract text from ${name}:`, error)
		return null
	}
}
