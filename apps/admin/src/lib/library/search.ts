import { libraryFile, libraryFileText, libraryFileVersion, type Database } from "@mpga/database"
import { and, desc, eq, inArray, isNull, like, or, sql, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/mysql-core"

import { folderPath, type Viewer } from "./access"
import { extractText } from "./extract"
import { fail, loadFolderState, type Executor, type LibraryResult } from "./service"

// ---------- Indexing ----------

/**
 * Store the searchable text of one version. Called after the upload has committed, so a slow
 * or failed extraction never holds up or breaks the upload itself.
 */
export async function indexVersion(
	db: Executor,
	versionId: number,
	fileName: string,
	bytes: Uint8Array,
): Promise<boolean> {
	const body = await extractText(fileName, bytes)
	if (!body) return false
	await db
		.insert(libraryFileText)
		.values({ versionId, body })
		.onDuplicateKeyUpdate({ set: { body } })
	return true
}

// ---------- Searching ----------

export const MAX_SEARCH_TERMS = 6
const MAX_RESULTS = 50
const SNIPPET_BEFORE = 80
const SNIPPET_LENGTH = 240

/** Words to look for: at least 2 characters, de-duplicated, at most six. */
export function parseQuery(query: string): string[] {
	const seen = new Set<string>()
	const terms: string[] = []
	for (const raw of query.split(/\s+/)) {
		const term = raw.trim().slice(0, 50)
		const key = term.toLowerCase()
		if (term.length < 2 || seen.has(key)) continue
		seen.add(key)
		terms.push(term)
		if (terms.length === MAX_SEARCH_TERMS) break
	}
	return terms
}

/** Escape LIKE wildcards so "50%" or "a_b" match literally. */
export function escapeLike(term: string): string {
	return term.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export interface SearchResult {
	fileId: number
	name: string
	/** "Board / Minutes" */
	path: string
	updatedAt: Date
	/** Text around the first match inside the file, or null when only the name matched. */
	snippet: string | null
}

/** Trim a raw window of text to whole words and mark where it was cut. */
export function tidySnippet(raw: string, startsAtBeginning: boolean, endsAtEnd: boolean): string {
	let text = raw.replace(/\s+/g, " ")
	if (!startsAtBeginning) text = text.replace(/^\S*\s/, "")
	if (!endsAtEnd) text = text.replace(/\s\S*$/, "")
	return `${startsAtBeginning ? "" : "… "}${text.trim()}${endsAtEnd ? "" : " …"}`
}

/**
 * Files the viewer can see whose name or text contains every term. Matching follows the
 * columns' collation, so it ignores case and accents. Name matches come first.
 */
export async function searchLibrary(
	db: Database,
	viewer: Viewer,
	query: string,
): Promise<LibraryResult<SearchResult[]>> {
	const terms = parseQuery(query)
	if (terms.length === 0) return fail("invalid", "Enter at least 2 characters to search.")

	const state = await loadFolderState(db, viewer)
	const visible = [...state.visible]
	if (visible.length === 0) return { ok: true, data: [] }

	const current = alias(libraryFileVersion, "current_version")
	const patterns = terms.map((t) => `%${escapeLike(t)}%`)
	const body = libraryFileText.body
	const eachTerm = patterns.map((p) => or(like(libraryFile.name, p), like(body, p))!)
	const nameMatches = and(...patterns.map((p) => like(libraryFile.name, p)))!
	// Position of the first term (in query order) that appears in the text, or 0 if none.
	const firstHit: SQL<number> = sql`(${sql.join(
		[
			sql`case`,
			...terms.map((t) => sql`when locate(${t}, ${body}) > 0 then locate(${t}, ${body})`),
			sql`else 0 end`,
		],
		sql` `,
	)})`

	const rows = await db
		.select({
			fileId: libraryFile.id,
			name: libraryFile.name,
			folderId: libraryFile.folderId,
			updatedAt: libraryFile.updatedAt,
			nameMatch: sql<number>`(${nameMatches})`,
			hasTextHit: sql<number>`(${firstHit} > 0)`,
			start: sql<number>`greatest(${firstHit} - ${SNIPPET_BEFORE}, 1)`,
			window: sql<
				string | null
			>`substring(${body}, greatest(${firstHit} - ${SNIPPET_BEFORE}, 1), ${SNIPPET_LENGTH})`,
			bodyLength: sql<number>`char_length(${body})`,
		})
		.from(libraryFile)
		.leftJoin(current, eq(current.id, libraryFile.currentVersionId))
		// A restored version reads the text of the original upload it repeats.
		.leftJoin(
			libraryFileText,
			eq(libraryFileText.versionId, sql`coalesce(${current.contentVersionId}, ${current.id})`),
		)
		.where(and(isNull(libraryFile.deletedAt), inArray(libraryFile.folderId, visible), ...eachTerm))
		.orderBy(desc(sql`(${nameMatches})`), desc(libraryFile.updatedAt))
		.limit(MAX_RESULTS)

	return {
		ok: true,
		data: rows.map((r) => {
			const start = Number(r.start)
			const snippet =
				Number(r.hasTextHit) && r.window
					? tidySnippet(
							r.window,
							start <= 1,
							start - 1 + SNIPPET_LENGTH >= Number(r.bodyLength ?? 0),
						)
					: null
			return {
				fileId: r.fileId,
				name: r.name,
				path: folderPath(state.folders, r.folderId)
					.map((f) => f.name)
					.join(" / "),
				updatedAt: r.updatedAt,
				snippet,
			}
		}),
	}
}
