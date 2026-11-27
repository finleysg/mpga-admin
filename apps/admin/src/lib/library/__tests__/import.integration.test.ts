// @vitest-environment node
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import {
	document,
	libraryAudit,
	libraryFile,
	libraryFileVersion,
	libraryFolder,
	libraryPublication,
	tournament,
	type Database,
} from "@mpga/database"
import { eq, sql } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import type { Viewer } from "../access"
import { folderPathFor, importBatch, planImport } from "../import-documents"
import { searchLibrary } from "../search"
import { createFolder, getFolderView } from "../service"
import { MemoryLibraryStorage } from "../storage"
import { LOCK_WAIT_MS, openLibraryTestDb } from "./test-db"

const fixture = (name: string) =>
	new Uint8Array(readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))))

const admin: Viewer = { id: "import-admin", isDocumentAdmin: true }
const TOURNAMENT = "Import Test Four Ball"

// Runs only against the disposable integration schema, never the application database.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("importing existing documents (MySQL)", () => {
	let db: Database
	let close: () => Promise<void>
	let storage: MemoryLibraryStorage
	let tournamentId: number

	beforeAll(async () => {
		;({ db, close } = await openLibraryTestDb())
	}, LOCK_WAIT_MS)

	afterAll(async () => {
		await db.execute(
			sql`DELETE FROM document WHERE tournamentId IN (SELECT id FROM tournament WHERE name = ${TOURNAMENT})`,
		)
		await db.delete(tournament).where(eq(tournament.name, TOURNAMENT))
		await close()
	})

	beforeEach(async () => {
		storage = new MemoryLibraryStorage()
		await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`)
		for (const table of [
			"library_publication",
			"library_file_text",
			"library_file_version",
			"library_file",
			"library_folder_member",
			"library_folder",
			"library_audit",
			"document",
		]) {
			await db.execute(sql.raw(`TRUNCATE TABLE ${table}`))
		}
		await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
		await db.delete(tournament).where(eq(tournament.name, TOURNAMENT))
		const [t] = await db.insert(tournament).values({ name: TOURNAMENT, description: "test" })
		tournamentId = t.insertId
	})

	async function addDocument(
		values: {
			title: string
			documentType: string
			year?: number | null
			file: string | null
			tournament?: boolean
		},
		body?: Uint8Array,
	) {
		const [doc] = await db.insert(document).values({
			title: values.title,
			documentType: values.documentType,
			year: values.year ?? null,
			file: values.file,
			lastUpdate: "2024-05-01 15:30:00.000000",
			createdBy: "legacy",
			tournamentId: values.tournament ? tournamentId : null,
		})
		if (body && values.file) storage.publicObjects.set(`media/${values.file}`, body)
		return doc.insertId
	}

	async function seed() {
		const ids = {
			results: await addDocument(
				{
					title: "2025 Results",
					documentType: "Results",
					year: 2025,
					file: "documents/1-results.pdf",
					tournament: true,
				},
				fixture("minutes.pdf"),
			),
			resultsAgain: await addDocument(
				{
					title: "2025 Results",
					documentType: "Results",
					year: 2025,
					file: "documents/2-results.pdf",
					tournament: true,
				},
				fixture("minutes.pdf"),
			),
			minutes: await addDocument(
				{
					title: "March: Minutes",
					documentType: "Minutes",
					year: 2024,
					file: "documents/3-minutes.docx",
				},
				fixture("bylaws.docx"),
			),
			bylaws: await addDocument(
				{ title: "ByLaws", documentType: "ByLaws", year: null, file: "documents/4-bylaws.pdf" },
				fixture("minutes.pdf"),
			),
			noExtension: await addDocument(
				{
					title: "2016 Junior Results",
					documentType: "Results",
					year: 2016,
					file: "documents/2016/2016_jr_results",
				},
				fixture("minutes.pdf"),
			),
			missing: await addDocument({
				title: "Gone",
				documentType: "Other",
				year: 2020,
				file: "documents/5-gone.pdf",
			}),
			unsupported: await addDocument(
				{ title: "Archive", documentType: "Other", year: 2020, file: "documents/6-archive.zip" },
				new Uint8Array([0x50, 0x4b, 3, 4]),
			),
			fake: await addDocument(
				{
					title: "Not really a PDF",
					documentType: "Other",
					year: 2020,
					file: "documents/7-fake.pdf",
				},
				new TextEncoder().encode("<html><script>alert(1)</script></html>"),
			),
		}
		return ids
	}

	async function importAll(batchSize = 3) {
		const all = []
		let after: number | null = 0
		while (after !== null) {
			const batch = await importBatch(db, storage, admin, { afterDocumentId: after, batchSize })
			all.push(...batch.results)
			after = batch.nextAfterDocumentId
		}
		return all
	}

	it("places documents by tournament or type, then year", () => {
		expect(
			folderPathFor({ documentType: "Results", year: 2025, tournamentName: "Four Ball" }),
		).toEqual(["Tournaments", "Four Ball", "2025"])
		expect(folderPathFor({ documentType: "Minutes", year: 2024, tournamentName: null })).toEqual([
			"Minutes",
			"2024",
		])
		expect(folderPathFor({ documentType: "ByLaws", year: null, tournamentName: null })).toEqual([
			"ByLaws",
		])
	})

	it("previews without changing anything", async () => {
		const ids = await seed()
		const plan = await planImport(db, storage)
		expect(plan).toMatchObject({ alreadyImported: 0, ready: 5, skipped: 3 })
		const byId = new Map(plan.items.map((i) => [i.documentId, i]))
		expect(byId.get(ids.results)).toMatchObject({
			folderPath: ["Tournaments", TOURNAMENT, "2025"],
			fileName: "2025 Results.pdf",
			status: "ready",
		})
		expect(byId.get(ids.resultsAgain)?.fileName).toBe("2025 Results (2).pdf")
		expect(byId.get(ids.minutes)?.fileName).toBe("March Minutes.docx")
		expect(byId.get(ids.missing)).toMatchObject({
			status: "skip",
			reason: "File missing from the public bucket",
		})
		expect(byId.get(ids.unsupported)).toMatchObject({
			status: "skip",
			reason: ".zip files aren't supported",
		})
		// No tournament: goes by type. Its type is recognised from the contents.
		expect(byId.get(ids.noExtension)).toMatchObject({
			folderPath: ["Results", "2016"],
			fileName: "2016 Junior Results.pdf",
			status: "ready",
		})
		// The preview reads the start of each file, so a mislabelled file is caught up front.
		expect(byId.get(ids.fake)).toMatchObject({
			status: "skip",
			reason: "The file doesn't look like a PDF file",
		})
		expect(plan.byTopFolder).toEqual([
			{ folder: "ByLaws", count: 1 },
			{ folder: "Minutes", count: 1 },
			{ folder: "Results", count: 1 },
			{ folder: "Tournaments", count: 2 },
		])
		expect(await db.select().from(libraryFile)).toHaveLength(0)
		expect(storage.objects.size).toBe(0)
	})

	it("imports in batches, linking each document to its library copy", async () => {
		const ids = await seed()
		await createFolder(db, admin, { parentId: null, name: "Minutes" })
		const results = await importAll(3)

		const imported = results.filter((r) => r.status === "imported").map((r) => r.documentId)
		expect(imported.sort()).toEqual(
			[ids.results, ids.resultsAgain, ids.minutes, ids.bylaws, ids.noExtension].sort(),
		)
		const skipped = Object.fromEntries(
			results.filter((r) => r.status === "skipped").map((r) => [r.documentId, r.reason]),
		)
		expect(skipped[ids.missing]).toBe("File missing from the public bucket")
		expect(skipped[ids.unsupported]).toBe(".zip files aren't supported")
		expect(skipped[ids.fake]).toBe("The file doesn't look like a PDF file")

		// Folder layout, reusing the existing Minutes folder.
		const folders = await db.select().from(libraryFolder)
		expect(folders.filter((f) => f.name === "Minutes")).toHaveLength(1)
		const top = await getFolderView(db, admin, null)
		expect(top.ok && top.data.subfolders.map((f) => f.name)).toEqual([
			"ByLaws",
			"Minutes",
			"Results",
			"Tournaments",
		])

		// The extensionless file was recognised as a PDF.
		const [noExt] = await db
			.select({ name: libraryFile.name })
			.from(libraryPublication)
			.innerJoin(libraryFileVersion, eq(libraryFileVersion.id, libraryPublication.versionId))
			.innerJoin(libraryFile, eq(libraryFile.id, libraryFileVersion.fileId))
			.where(eq(libraryPublication.documentId, ids.noExtension))
		expect(noExt?.name).toBe("2016 Junior Results.pdf")

		// Versions keep the document's date; documents still point at the same public file.
		const versions = await db.select().from(libraryFileVersion)
		expect(
			versions.every(
				(v) => v.versionNo === 1 && v.uploadedAt.toISOString() === "2024-05-01T15:30:00.000Z",
			),
		).toBe(true)
		const [doc] = await db.select().from(document).where(eq(document.id, ids.results))
		expect(doc?.file).toBe("documents/1-results.pdf")
		expect(await db.select().from(libraryPublication)).toHaveLength(5)
		expect(storage.objects.size).toBe(5)

		const audits = await db.select().from(libraryAudit).where(eq(libraryAudit.action, "migrate"))
		expect(audits).toHaveLength(5)

		const search = await searchLibrary(db, admin, "treasurer")
		expect(search.ok && search.data.map((r) => r.name)).toEqual(["March Minutes.docx"])
	})

	it("can be re-run safely", async () => {
		await seed()
		await importAll(10)
		const again = await importAll(10)
		expect(again.filter((r) => r.status === "imported")).toHaveLength(0)
		expect(again.filter((r) => r.status === "skipped")).toHaveLength(3)
		expect(await db.select().from(libraryFile)).toHaveLength(5)
		const plan = await planImport(db, storage)
		expect(plan).toMatchObject({ alreadyImported: 5, ready: 0, skipped: 3 })
	})

	it("refuses to run for someone who isn't a document admin", async () => {
		await expect(
			importBatch(db, storage, { id: "board", isDocumentAdmin: false }),
		).rejects.toThrow()
	})
})
