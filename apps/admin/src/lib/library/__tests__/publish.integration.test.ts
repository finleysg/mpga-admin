// @vitest-environment node
import {
	document,
	libraryAudit,
	libraryFolder,
	libraryFolderMember,
	libraryPublication,
	type Database,
} from "@mpga/database"
import { eq, sql } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import type { Viewer } from "../access"
import { getDocumentSource, listPublications, publishToDocument, republishLatest } from "../publish"
import { createFolder, uploadFile } from "../service"
import { MemoryLibraryStorage } from "../storage"
import { LOCK_WAIT_MS, openLibraryTestDb } from "./test-db"

const pdf = (body: string) => new TextEncoder().encode(`%PDF-1.7 ${body}`)

const admin: Viewer = { id: "pub-admin", isDocumentAdmin: true }
const alice: Viewer = { id: "pub-alice", isDocumentAdmin: false }

// Runs only against the disposable integration schema, never the application database.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("library publishing (MySQL)", () => {
	let db: Database
	let close: () => Promise<void>
	let storage: MemoryLibraryStorage

	beforeAll(async () => {
		;({ db, close } = await openLibraryTestDb())
	}, LOCK_WAIT_MS)

	afterAll(async () => {
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
	})

	async function setup(restricted = false) {
		const folder = await createFolder(db, admin, { parentId: null, name: "Board" })
		if (!folder.ok) throw new Error(folder.error)
		if (restricted) {
			await db
				.update(libraryFolder)
				.set({ isRestricted: true })
				.where(eq(libraryFolder.id, folder.data.id))
			await db.insert(libraryFolderMember).values({ folderId: folder.data.id, userId: alice.id })
		}
		const up = await uploadFile(db, storage, alice, {
			folderId: folder.data.id,
			name: "Entry Form.pdf",
			bytes: pdf("v1"),
			mode: "new",
		})
		if (!up.ok) throw new Error(up.error)
		const [doc] = await db.insert(document).values({
			title: "Four Ball Entry Form",
			documentType: "Registration",
			year: 2026,
			lastUpdate: "2026-01-01 00:00:00",
			createdBy: admin.id,
		})
		return { folderId: folder.data.id, fileId: up.data.fileId, documentId: doc.insertId }
	}

	async function newVersion(folderId: number, body: string) {
		const v = await uploadFile(db, storage, alice, {
			folderId,
			name: "Entry Form.pdf",
			bytes: pdf(body),
			mode: "newVersion",
		})
		if (!v.ok) throw new Error(v.error)
		return v.data
	}

	it("publishes a snapshot copy and points the document at it", async () => {
		const { fileId, documentId } = await setup()
		const result = await publishToDocument(db, storage, admin, { documentId, fileId })
		expect(result).toMatchObject({ ok: true, data: { versionNo: 1 } })
		if (!result.ok) return
		expect(result.data.file).toMatch(/^documents\/\d+-\d+-[0-9a-f]{8}-Entry_Form\.pdf$/)
		expect(storage.published.has(`media/${result.data.file}`)).toBe(true)
		const [doc] = await db.select().from(document).where(eq(document.id, documentId))
		expect(doc?.file).toBe(result.data.file)
		const audits = await db.select().from(libraryAudit).where(eq(libraryAudit.action, "publish"))
		expect(audits).toMatchObject([{ entityId: fileId, actorUserId: admin.id }])
	})

	it("keeps the public copy on the published version until re-published", async () => {
		const { folderId, fileId, documentId } = await setup()
		const first = await publishToDocument(db, storage, admin, { documentId, fileId })
		if (!first.ok) throw new Error(first.error)
		await newVersion(folderId, "v2")

		const [doc] = await db.select().from(document).where(eq(document.id, documentId))
		expect(doc?.file).toBe(first.data.file)
		const listed = await listPublications(db, alice, fileId)
		expect(listed.ok && listed.data).toMatchObject([
			{ documentId, versionNo: 1, isCurrent: false, title: "Four Ball Entry Form" },
		])
		const source = await getDocumentSource(db, [documentId])
		expect(source.get(documentId)).toMatchObject({ versionNo: 1, isCurrent: false })

		const again = await republishLatest(db, storage, admin, fileId, new Date(Date.now() + 1000))
		expect(again).toMatchObject({ ok: true, data: { updated: 1 } })
		const [updated] = await db.select().from(document).where(eq(document.id, documentId))
		expect(updated?.file).not.toBe(first.data.file)
		const after = await listPublications(db, alice, fileId)
		expect(after.ok && after.data[0]).toMatchObject({ versionNo: 2, isCurrent: true })
		expect(await republishLatest(db, storage, admin, fileId)).toMatchObject({
			ok: true,
			data: { updated: 0 },
		})
	})

	it("gives every document its own public object, even when re-published together", async () => {
		const { folderId, fileId, documentId } = await setup()
		const [second] = await db.insert(document).values({
			title: "Mid Am Entry Form",
			documentType: "Registration",
			year: 2026,
			lastUpdate: "2026-01-01 00:00:00",
			createdBy: admin.id,
		})
		const sameMoment = new Date("2026-03-01T12:00:00Z")
		for (const id of [documentId, second.insertId]) {
			expect(
				(await publishToDocument(db, storage, admin, { documentId: id, fileId }, sameMoment)).ok,
			).toBe(true)
		}
		await newVersion(folderId, "v2")
		expect(await republishLatest(db, storage, admin, fileId, sameMoment)).toMatchObject({
			ok: true,
			data: { updated: 2 },
		})
		const files = (await db.select({ file: document.file }).from(document)).map((d) => d.file)
		expect(new Set(files).size).toBe(2)
		for (const file of files) expect(storage.published.has(`media/${file}`)).toBe(true)
	})

	it("fits the public key in document.file for a 200-character name", async () => {
		const folder = await createFolder(db, admin, { parentId: null, name: "Long" })
		if (!folder.ok) throw new Error(folder.error)
		const longName = `${"a".repeat(196)}.pdf`
		const up = await uploadFile(db, storage, alice, {
			folderId: folder.data.id,
			name: longName,
			bytes: pdf("v1"),
			mode: "new",
		})
		if (!up.ok) throw new Error(up.error)
		await db.insert(document).values({
			id: 9_999_999,
			title: "Long name",
			documentType: "Other",
			lastUpdate: "2026-01-01 00:00:00",
			createdBy: admin.id,
		})
		const result = await publishToDocument(db, storage, admin, {
			documentId: 9_999_999,
			fileId: up.data.fileId,
		})
		expect(result.ok).toBe(true)
		const [doc] = await db.select().from(document).where(eq(document.id, 9_999_999))
		expect(doc?.file?.length).toBeLessThanOrEqual(200)
		expect(doc?.file).toMatch(/^documents\/\d+-9999999-[0-9a-f]{8}-a+\.pdf$/)
	})

	it("lets only document admins publish, and records restricted-folder publishing", async () => {
		const { fileId, documentId } = await setup(true)
		expect(await publishToDocument(db, storage, alice, { documentId, fileId })).toMatchObject({
			ok: false,
			code: "forbidden",
		})
		expect(await republishLatest(db, storage, alice, fileId)).toMatchObject({
			ok: false,
			code: "forbidden",
		})
		expect((await publishToDocument(db, storage, admin, { documentId, fileId })).ok).toBe(true)
		const [audit] = await db.select().from(libraryAudit).where(eq(libraryAudit.action, "publish"))
		expect(audit?.details).toMatchObject({ fromRestrictedFolder: true })
	})

	it("refuses files in Trash and missing documents", async () => {
		const { fileId, documentId } = await setup()
		expect(
			await publishToDocument(db, storage, admin, { documentId: documentId + 99, fileId }),
		).toMatchObject({ ok: false, code: "not_found" })
		await db.execute(sql`UPDATE library_file SET deleted_at = NOW(3) WHERE id = ${fileId}`)
		expect(await publishToDocument(db, storage, admin, { documentId, fileId })).toMatchObject({
			ok: false,
			code: "not_found",
		})
		expect(await db.select().from(libraryPublication)).toHaveLength(0)
	})
})
