// @vitest-environment node
import {
	createDb,
	libraryAudit,
	libraryFile,
	libraryFileVersion,
	libraryFolder,
	libraryFolderMember,
	type Database,
} from "@mpga/database"
import { and, eq, sql } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import type { Viewer } from "../access"
import { createFolder, getDownloadUrl, uploadFile } from "../service"
import { MemoryLibraryStorage } from "../storage"

const pdf = (body = "board minutes") => new TextEncoder().encode(`%PDF-1.7 ${body}`)
const docx = () => new Uint8Array([0x50, 0x4b, 0x03, 0x04, 9, 9, 9])

const admin: Viewer = { id: "admin-1", isDocumentAdmin: true }
const alice: Viewer = { id: "board-alice", isDocumentAdmin: false }
const bob: Viewer = { id: "board-bob", isDocumentAdmin: false }

// Runs only against the disposable integration schema, never the application database.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("library service (MySQL)", () => {
	let db: Database
	let storage: MemoryLibraryStorage

	beforeAll(() => {
		db = createDb({
			host: "127.0.0.1",
			port: Number(process.env.TEST_DATABASE_PORT),
			user: "root",
			password: "mpga-test-only",
			database: "mpga_security_test",
		})
	})

	afterAll(async () => {
		await db.$client.end()
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
		]) {
			await db.execute(sql.raw(`TRUNCATE TABLE ${table}`))
		}
		await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
	})

	async function folder(name: string, parentId: number | null = null) {
		const result = await createFolder(db, admin, { parentId, name })
		if (!result.ok) throw new Error(result.error)
		return result.data.id
	}

	async function audits(entityType: string, entityId: number) {
		return db
			.select()
			.from(libraryAudit)
			.where(and(eq(libraryAudit.entityType, entityType), eq(libraryAudit.entityId, entityId)))
	}

	describe("folders", () => {
		it("lets only document admins create folders, with an audit row", async () => {
			expect(await createFolder(db, alice, { parentId: null, name: "Board" })).toMatchObject({
				ok: false,
				code: "forbidden",
			})
			const id = await folder("Board")
			expect(await audits("folder", id)).toMatchObject([
				{ action: "create", actorUserId: "admin-1" },
			])
		})

		it("limits nesting to 4 levels", async () => {
			const one = await folder("One")
			const two = await folder("Two", one)
			const three = await folder("Three", two)
			const four = await folder("Four", three)
			expect(await createFolder(db, admin, { parentId: four, name: "Five" })).toMatchObject({
				ok: false,
				code: "invalid",
			})
		})

		it("rejects duplicate sibling names regardless of case", async () => {
			await folder("Minutes")
			expect(await createFolder(db, admin, { parentId: null, name: "minutes" })).toMatchObject({
				ok: false,
				code: "name_conflict",
			})
		})
	})

	describe("uploads", () => {
		it("stores a new file as version 1 with an audit row", async () => {
			const id = await folder("Minutes")
			const result = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "2026-01.pdf",
				bytes: pdf(),
				mode: "new",
			})
			expect(result).toMatchObject({ ok: true, data: { versionNo: 1, name: "2026-01.pdf" } })
			if (!result.ok) return
			const [file] = await db
				.select()
				.from(libraryFile)
				.where(eq(libraryFile.id, result.data.fileId))
			expect(file).toMatchObject({ currentVersionId: result.data.versionId, createdBy: alice.id })
			const [version] = await db
				.select()
				.from(libraryFileVersion)
				.where(eq(libraryFileVersion.id, result.data.versionId))
			expect(version).toMatchObject({ contentType: "application/pdf", uploadedBy: alice.id })
			expect(storage.objects.get(version!.s3Key)?.contentType).toBe("application/pdf")
			expect(await audits("file", result.data.fileId)).toMatchObject([{ action: "upload" }])
		})

		it("asks the member what to do when the name exists, without storing anything", async () => {
			const id = await folder("Minutes")
			const first = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "Agenda.pdf",
				bytes: pdf(),
				mode: "new",
			})
			const again = await uploadFile(db, storage, bob, {
				folderId: id,
				name: "agenda.pdf",
				bytes: pdf("v2"),
				mode: "new",
			})
			expect(again).toMatchObject({
				ok: false,
				code: "name_conflict",
				existingFileId: first.ok ? first.data.fileId : -1,
			})
			expect(storage.objects.size).toBe(1)
		})

		it("adds a new version and keeps history", async () => {
			const id = await folder("Minutes")
			const first = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "Agenda.pdf",
				bytes: pdf(),
				mode: "new",
			})
			const second = await uploadFile(db, storage, bob, {
				folderId: id,
				name: "Agenda.pdf",
				bytes: pdf("v2"),
				mode: "newVersion",
			})
			expect(second).toMatchObject({ ok: true, data: { versionNo: 2, name: "Agenda.pdf" } })
			if (!first.ok || !second.ok) return
			expect(second.data.fileId).toBe(first.data.fileId)
			const versions = await db
				.select()
				.from(libraryFileVersion)
				.where(eq(libraryFileVersion.fileId, first.data.fileId))
			expect(versions.map((v) => [v.versionNo, v.uploadedBy])).toEqual([
				[1, alice.id],
				[2, bob.id],
			])
			const [file] = await db
				.select()
				.from(libraryFile)
				.where(eq(libraryFile.id, first.data.fileId))
			expect(file).toMatchObject({ currentVersionId: second.data.versionId, updatedBy: bob.id })
			expect((await audits("file", first.data.fileId)).map((a) => a.action)).toEqual([
				"upload",
				"new_version",
			])
		})

		it("keeps both with a (2) suffix", async () => {
			const id = await folder("Minutes")
			await uploadFile(db, storage, alice, {
				folderId: id,
				name: "Agenda.pdf",
				bytes: pdf(),
				mode: "new",
			})
			const both = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "Agenda.pdf",
				bytes: pdf(),
				mode: "keepBoth",
			})
			expect(both).toMatchObject({ ok: true, data: { name: "Agenda (2).pdf", versionNo: 1 } })
		})

		it("never gives two concurrent uploads the same name", async () => {
			const id = await folder("Minutes")
			const results = await Promise.all(
				[1, 2, 3].map(() =>
					uploadFile(db, storage, alice, {
						folderId: id,
						name: "Agenda.pdf",
						bytes: pdf(),
						mode: "keepBoth",
					}),
				),
			)
			const names = results.map((r) => (r.ok ? r.data.name : r.error)).sort()
			expect(names).toEqual(["Agenda (2).pdf", "Agenda (3).pdf", "Agenda.pdf"])
		})

		it("rejects files whose contents don't match, before storing", async () => {
			const id = await folder("Minutes")
			const result = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "fake.pdf",
				bytes: new TextEncoder().encode("<html>"),
				mode: "new",
			})
			expect(result).toMatchObject({ ok: false, code: "invalid" })
			expect(storage.objects.size).toBe(0)
		})

		it("writes nothing to the database when storage fails", async () => {
			const id = await folder("Minutes")
			storage.failNextPut = true
			await expect(
				uploadFile(db, storage, alice, { folderId: id, name: "a.pdf", bytes: pdf(), mode: "new" }),
			).rejects.toThrow()
			expect(await db.select().from(libraryFile)).toHaveLength(0)
			expect(
				await db.select().from(libraryAudit).where(eq(libraryAudit.entityType, "file")),
			).toHaveLength(0)
		})
	})

	describe("restricted folders and downloads", () => {
		async function restrictedSetup() {
			const board = await folder("Board")
			const exec = await folder("Executive Committee", board)
			await db.update(libraryFolder).set({ isRestricted: true }).where(eq(libraryFolder.id, exec))
			await db.insert(libraryFolderMember).values({ folderId: exec, userId: alice.id })
			return { board, exec }
		}

		it("hides restricted folders from non-members for upload and download", async () => {
			const { exec } = await restrictedSetup()
			const upload = await uploadFile(db, storage, alice, {
				folderId: exec,
				name: "Salaries.pdf",
				bytes: pdf(),
				mode: "new",
			})
			expect(upload.ok).toBe(true)
			if (!upload.ok) return
			expect(
				await uploadFile(db, storage, bob, {
					folderId: exec,
					name: "x.pdf",
					bytes: pdf(),
					mode: "new",
				}),
			).toMatchObject({ ok: false, code: "not_found" })
			expect(await getDownloadUrl(db, storage, bob, upload.data.versionId)).toMatchObject({
				ok: false,
				code: "not_found",
			})
			expect((await getDownloadUrl(db, storage, alice, upload.data.versionId)).ok).toBe(true)
			expect((await getDownloadUrl(db, storage, admin, upload.data.versionId)).ok).toBe(true)
		})

		it("previews PDFs inline but always downloads Office files", async () => {
			const { board } = await restrictedSetup()
			const p = await uploadFile(db, storage, bob, {
				folderId: board,
				name: "a.pdf",
				bytes: pdf(),
				mode: "new",
			})
			const d = await uploadFile(db, storage, bob, {
				folderId: board,
				name: "b.docx",
				bytes: docx(),
				mode: "new",
			})
			if (!p.ok || !d.ok) throw new Error("upload failed")
			const preview = await getDownloadUrl(db, storage, bob, p.data.versionId, { preview: true })
			expect(preview).toMatchObject({ ok: true, data: { inline: true } })
			expect(preview.ok && preview.data.url).toContain("disposition=inline")
			expect(preview.ok && preview.data.url).toContain("expiresIn=300")
			const office = await getDownloadUrl(db, storage, bob, d.data.versionId, { preview: true })
			expect(office).toMatchObject({ ok: true, data: { inline: false } })
			expect(office.ok && office.data.url).toContain("disposition=attachment")
		})

		it("lets only document admins open files in Trash", async () => {
			const { board } = await restrictedSetup()
			const up = await uploadFile(db, storage, bob, {
				folderId: board,
				name: "a.pdf",
				bytes: pdf(),
				mode: "new",
			})
			if (!up.ok) throw new Error(up.error)
			await db
				.update(libraryFile)
				.set({ deletedAt: new Date() })
				.where(eq(libraryFile.id, up.data.fileId))
			expect((await getDownloadUrl(db, storage, bob, up.data.versionId)).ok).toBe(false)
			expect((await getDownloadUrl(db, storage, admin, up.data.versionId)).ok).toBe(true)
		})
	})
})
