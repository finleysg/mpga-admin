import path from "node:path"
import { Worker } from "node:worker_threads"

// Parsing untrusted PDF and Office files runs in a worker thread so it can be stopped. A timer
// in the request process can only stop *waiting*; the parser would keep using CPU and memory,
// and synchronous parsing can block the event loop so the timer never fires. Terminating the
// worker ends the work, and resourceLimits caps its heap.

export type ParserKind = "pdf" | "docx" | "xlsx"

export const WORKER_TIMEOUT_MS = 20_000
const WORKER_LIMITS = { maxOldGenerationSizeMb: 256, maxYoungGenerationSizeMb: 32 }

// Plain JavaScript evaluated as the worker. It's inlined rather than a separate file so it
// doesn't depend on how the bundler (webpack in dev, Turbopack in production) emits workers.
// It loads the parser packages from node_modules at runtime.
const WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require("node:worker_threads")
const { createRequire } = require("node:module")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const fs = require("node:fs")

// Turbopack production builds don't keep top-level node_modules links for external packages;
// they add hashed links instead, e.g. .next/node_modules/unpdf-179234ab3adb13cc. Resolve from
// the link's real path so the package's own dependencies are found next to it.
function resolveFromNextModules(dir, name) {
	const base = path.join(dir, ".next", "node_modules")
	let entries
	try {
		entries = fs.readdirSync(base)
	} catch {
		return null
	}
	const hit = entries.find((e) => e === name || (e.startsWith(name + "-") && /^[0-9a-f]+$/.test(e.slice(name.length + 1))))
	if (!hit) return null
	const real = fs.realpathSync(path.join(base, hit))
	return createRequire(path.join(real, "noop.js")).resolve(name)
}

function resolvePackage(name) {
	let lastError
	for (const dir of workerData.resolveFrom) {
		try {
			return createRequire(path.join(dir, "noop.js")).resolve(name)
		} catch (error) {
			lastError = error
		}
		try {
			const resolved = resolveFromNextModules(dir, name)
			if (resolved) return resolved
		} catch (error) {
			lastError = error
		}
	}
	throw lastError || new Error("Cannot find " + name)
}

async function load(name) {
	return import(pathToFileURL(resolvePackage(name)).href)
}

function cellText(value) {
	if (value === null || value === undefined) return ""
	if (value instanceof Date) return value.toISOString().slice(0, 10)
	if (typeof value !== "object") return String(value)
	if (value.richText) return value.richText.map((r) => r.text).join("")
	if (value.text !== undefined) return cellText(value.text)
	if (value.result !== undefined) return cellText(value.result)
	return ""
}

async function run() {
	const bytes = new Uint8Array(workerData.bytes)
	if (workerData.kind === "pdf") {
		const { extractText, getDocumentProxy } = await load("unpdf")
		const pdf = await getDocumentProxy(bytes)
		try {
			return (await extractText(pdf, { mergePages: true })).text
		} finally {
			await pdf.loadingTask.destroy()
		}
	}
	if (workerData.kind === "docx") {
		const mod = await load("mammoth")
		const mammoth = mod.default ?? mod
		return (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value
	}
	if (workerData.kind === "xlsx") {
		const mod = await load("exceljs")
		const ExcelJS = mod.default ?? mod
		const workbook = new ExcelJS.Workbook()
		await workbook.xlsx.load(Buffer.from(bytes))
		const lines = []
		workbook.eachSheet((sheet) => {
			lines.push(sheet.name)
			sheet.eachRow((row) => {
				const cells = []
				row.eachCell((cell) => {
					const text = cellText(cell.value).trim()
					if (text) cells.push(text)
				})
				if (cells.length) lines.push(cells.join(" "))
			})
		})
		return lines.join("\n")
	}
	throw new Error("Unknown parser " + workerData.kind)
}

run().then(
	(text) => parentPort.postMessage({ text }),
	(error) => parentPort.postMessage({ error: String((error && error.message) || error) }),
)
`

/**
 * Directories to resolve parser packages from. The dev server and the standalone production
 * server both run with the app directory as the working directory; the repository root is a
 * fallback for tools started elsewhere (e.g. tests run from the root).
 */
function resolveDirs(): string[] {
	const cwd = process.cwd()
	return [cwd, path.join(cwd, "apps", "admin")]
}

// The parsers are loaded only inside the worker. These imports never run (the variable is
// never set), but they keep the packages in Next's standalone output trace, which only copies
// node_modules that server code references. See serverExternalPackages in next.config.ts.
if (process.env.MPGA_LIBRARY_TRACE_PARSERS === "this-never-runs") {
	void import("unpdf")
	void import("mammoth")
	void import("exceljs")
}

// One extraction at a time: a burst of uploads can't run many parsers at once.
let queue: Promise<unknown> = Promise.resolve()

/** Parse `bytes` in a fresh worker; rejects on timeout, crash, or memory limit. */
export function parseInWorker(
	kind: ParserKind,
	bytes: Uint8Array,
	timeoutMs = WORKER_TIMEOUT_MS,
): Promise<string> {
	const job = queue.then(() => runWorker(kind, bytes, timeoutMs))
	queue = job.catch(() => undefined)
	return job
}

function runWorker(kind: ParserKind, bytes: Uint8Array, timeoutMs: number): Promise<string> {
	// Copy into a buffer the worker can own, so the caller's bytes stay usable.
	const copy = bytes.slice().buffer
	return runInWorker(
		WORKER_SOURCE,
		{ kind, bytes: copy, resolveFrom: resolveDirs() },
		[copy],
		timeoutMs,
	)
}

/**
 * Run `source` in a worker with memory limits and post back `{ text }` or `{ error }`. On
 * timeout the worker is terminated, which stops even a synchronous infinite loop.
 */
export function runInWorker(
	source: string,
	workerData: unknown,
	transferList: ArrayBuffer[],
	timeoutMs: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(source, {
			eval: true,
			workerData,
			transferList,
			resourceLimits: WORKER_LIMITS,
		})
		let settled = false
		const finish = (fn: () => void) => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			void worker.terminate()
			fn()
		}
		const timer = setTimeout(
			() => finish(() => reject(new Error(`Text extraction took longer than ${timeoutMs} ms`))),
			timeoutMs,
		)
		worker.once("message", (message: { text?: string; error?: string }) =>
			finish(() =>
				message.error !== undefined
					? reject(new Error(message.error))
					: resolve(message.text ?? ""),
			),
		)
		worker.once("error", (error) => finish(() => reject(error)))
		worker.once("exit", (code) =>
			finish(() => reject(new Error(`Text extraction stopped unexpectedly (exit ${code})`))),
		)
	})
}
