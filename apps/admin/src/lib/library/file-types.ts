// What the library accepts, and how each type is served. Client-safe: no server imports.

export const MAX_FILE_BYTES = 5 * 1024 * 1024

type Signature = "pdf" | "zip" | "ole" | "png" | "jpeg" | "gif" | "webp" | "text"

interface FileTypeInfo {
	contentType: string
	signature: Signature
	/** Opened in the browser. Everything else is always downloaded. */
	inline: boolean
	label: string
}

const FILE_TYPES: Record<string, FileTypeInfo> = {
	pdf: { contentType: "application/pdf", signature: "pdf", inline: true, label: "PDF" },
	doc: { contentType: "application/msword", signature: "ole", inline: false, label: "Word" },
	docx: {
		contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		signature: "zip",
		inline: false,
		label: "Word",
	},
	xls: { contentType: "application/vnd.ms-excel", signature: "ole", inline: false, label: "Excel" },
	xlsx: {
		contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		signature: "zip",
		inline: false,
		label: "Excel",
	},
	ppt: {
		contentType: "application/vnd.ms-powerpoint",
		signature: "ole",
		inline: false,
		label: "PowerPoint",
	},
	pptx: {
		contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		signature: "zip",
		inline: false,
		label: "PowerPoint",
	},
	jpg: { contentType: "image/jpeg", signature: "jpeg", inline: true, label: "Image" },
	jpeg: { contentType: "image/jpeg", signature: "jpeg", inline: true, label: "Image" },
	png: { contentType: "image/png", signature: "png", inline: true, label: "Image" },
	gif: { contentType: "image/gif", signature: "gif", inline: true, label: "Image" },
	webp: { contentType: "image/webp", signature: "webp", inline: true, label: "Image" },
	txt: {
		contentType: "text/plain; charset=utf-8",
		signature: "text",
		inline: false,
		label: "Text",
	},
	csv: { contentType: "text/csv; charset=utf-8", signature: "text", inline: false, label: "CSV" },
	md: {
		contentType: "text/markdown; charset=utf-8",
		signature: "text",
		inline: false,
		label: "Markdown",
	},
}

export const ACCEPT_ATTRIBUTE = Object.keys(FILE_TYPES)
	.map((ext) => `.${ext}`)
	.join(",")

export function fileExtension(name: string): string {
	const dot = name.lastIndexOf(".")
	return dot < 0 ? "" : name.slice(dot + 1).toLowerCase()
}

export function fileTypeInfo(name: string): FileTypeInfo | undefined {
	return FILE_TYPES[fileExtension(name)]
}

export function isInlineType(name: string): boolean {
	return fileTypeInfo(name)?.inline ?? false
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Checks done in the browser before sending, and again on the server. */
export function checkFileBasics(name: string, size: number): string | null {
	if (!fileTypeInfo(name)) {
		return `${name}: this file type isn't allowed. Use PDF, Word, Excel, PowerPoint, JPG, PNG, GIF, WebP, text, CSV or markdown.`
	}
	if (size === 0) return `${name} is empty.`
	if (size > MAX_FILE_BYTES) {
		return `${name} is ${formatBytes(size)}. Files can be up to ${formatBytes(MAX_FILE_BYTES)}.`
	}
	return null
}

function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
	return prefix.every((b, i) => bytes[offset + i] === b)
}

function matchesSignature(bytes: Uint8Array, signature: Signature): boolean {
	switch (signature) {
		case "pdf":
			return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]) // %PDF-
		case "zip":
			return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) // PK.. (Office Open XML)
		case "ole":
			return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) // legacy Office
		case "png":
			return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
		case "jpeg":
			return startsWith(bytes, [0xff, 0xd8, 0xff])
		case "gif":
			return startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) // GIF8
		case "webp":
			return (
				startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
				startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
			)
		case "text":
			return isPlainText(bytes)
	}
}

function isPlainText(bytes: Uint8Array): boolean {
	if (bytes.includes(0)) return false
	try {
		new TextDecoder("utf-8", { fatal: true }).decode(bytes)
		return true
	} catch {
		return false
	}
}

export type ValidatedFile = { contentType: string; label: string }

/**
 * Full server-side check: allowed extension, size, and that the contents really are that type.
 * The browser's reported type is never trusted.
 */
export function validateFile(
	name: string,
	bytes: Uint8Array,
): { ok: true; file: ValidatedFile } | { ok: false; error: string } {
	const basic = checkFileBasics(name, bytes.byteLength)
	if (basic) return { ok: false, error: basic }
	const info = fileTypeInfo(name)!
	if (!matchesSignature(bytes, info.signature)) {
		return { ok: false, error: `${name} doesn't look like a ${info.label} file.` }
	}
	return { ok: true, file: { contentType: info.contentType, label: info.label } }
}
