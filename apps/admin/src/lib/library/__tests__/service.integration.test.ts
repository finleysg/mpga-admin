// @vitest-environment node
import {
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
import { copyVersionText, indexVersion, searchLibrary } from "../search"
import {
	createFolder,
	getDownloadUrl,
	getFileView,
	getFolderView,
	uploadFile,
	uploadVersion,
} from "../service"
import { MemoryLibraryStorage } from "../storage"
import { openLibraryTestDb } from "./test-db"

const pdf = (body = "board minutes") => new TextEncoder().encode(`%PDF-1.7 ${body}`)
const docx = () => new Uint8Array([0x50, 0x4b, 0x03, 0x04, 9, 9, 9])

const admin: Viewer = { id: "admin-1", isDocumentAdmin: true }
const alice: Viewer = { id: "board-alice", isDocumentAdmin: false }
const bob: Viewer = { id: "board-bob", isDocumentAdmin: false }

// Runs only against the disposable integration schema, never the application database.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("library service (MySQL)", () => {
	let db: Database
	let close: () => Promise<void>
	let storage: MemoryLibraryStorage

	beforeAll(async () => {
		;({ db, close } = await openLibraryTestDb())
	})

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

		it("never creates two top-level folders with the same name, even concurrently", async () => {
			const results = await Promise.all(
				Array.from({ length: 5 }, () =>
					createFolder(db, admin, { parentId: null, name: "Minutes" }),
				),
			)
			expect(results.filter((r) => r.ok)).toHaveLength(1)
			expect(results.filter((r) => !r.ok && r.code === "name_conflict")).toHaveLength(4)
			expect(await db.select().from(libraryFolder)).toHaveLength(1)
		})

		it("lets a name be reused once the old folder is in Trash", async () => {
			const id = await folder("Minutes")
			await db.update(libraryFolder).set({ deletedAt: new Date() }).where(eq(libraryFolder.id, id))
			expect((await createFolder(db, admin, { parentId: null, name: "Minutes" })).ok).toBe(true)
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

		it("detects clashes the way the database collation does (accents and case)", async () => {
			const id = await folder("Minutes")
			const first = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "Resume.pdf",
				bytes: pdf(),
				mode: "new",
			})
			if (!first.ok) throw new Error(first.error)
			const clash = await uploadFile(db, storage, bob, {
				folderId: id,
				name: "résumé.PDF",
				bytes: pdf(),
				mode: "new",
			})
			expect(clash).toMatchObject({
				ok: false,
				code: "name_conflict",
				existingFileId: first.data.fileId,
			})
			const version = await uploadFile(db, storage, bob, {
				folderId: id,
				name: "résumé.PDF",
				bytes: pdf(),
				mode: "newVersion",
			})
			expect(version).toMatchObject({ ok: true, data: { fileId: first.data.fileId, versionNo: 2 } })
			const both = await uploadFile(db, storage, bob, {
				folderId: id,
				name: "résumé.PDF",
				bytes: pdf(),
				mode: "keepBoth",
			})
			expect(both).toMatchObject({ ok: true, data: { name: "résumé (2).PDF" } })
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

		it("keeps both for a file name at the length limit", async () => {
			const id = await folder("Minutes")
			const long = `${"a".repeat(196)}.pdf`
			await uploadFile(db, storage, alice, { folderId: id, name: long, bytes: pdf(), mode: "new" })
			const both = await uploadFile(db, storage, alice, {
				folderId: id,
				name: long,
				bytes: pdf(),
				mode: "keepBoth",
			})
			expect(both.ok).toBe(true)
			expect(both.ok && both.data.name).toHaveLength(200)
			expect(both.ok && both.data.name.endsWith(" (2).pdf")).toBe(true)
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

	describe("reading and new versions", () => {
		it("adds a version from the file page and rejects a different file type", async () => {
			const id = await folder("Minutes")
			const up = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "Agenda.pdf",
				bytes: pdf(),
				mode: "new",
			})
			if (!up.ok) throw new Error(up.error)
			const wrongType = await uploadVersion(db, storage, bob, {
				fileId: up.data.fileId,
				name: "agenda.docx",
				bytes: docx(),
			})
			expect(wrongType).toMatchObject({ ok: false, code: "invalid" })
			const renamed = await uploadVersion(db, storage, bob, {
				fileId: up.data.fileId,
				name: "Agenda FINAL.pdf",
				bytes: pdf("final"),
			})
			// The file keeps its name; the upload's own name is kept on the version.
			expect(renamed).toMatchObject({ ok: true, data: { versionNo: 2, name: "Agenda.pdf" } })
			const view = await getFileView(db, alice, up.data.fileId)
			expect(view.ok && view.data.versions.map((v) => v.versionNo)).toEqual([2, 1])
			expect(view.ok && view.data.current.versionNo).toBe(2)
		})

		it("lists a folder's subfolders and files, sorted, with version counts", async () => {
			const board = await folder("Board")
			await folder("Minutes", board)
			await folder("Agendas", board)
			for (const name of ["b.pdf", "a.pdf", "b.pdf"]) {
				await uploadFile(db, storage, alice, {
					folderId: board,
					name,
					bytes: pdf(),
					mode: "newVersion",
				})
			}
			const view = await getFolderView(db, alice, board)
			if (!view.ok) throw new Error(view.error)
			expect(view.data.subfolders.map((f) => f.name)).toEqual(["Agendas", "Minutes"])
			expect(view.data.files.map((f) => [f.name, f.versionCount])).toEqual([
				["a.pdf", 1],
				["b.pdf", 2],
			])
			expect(view.data.path.map((f) => f.name)).toEqual(["Board"])
			const top = await getFolderView(db, alice, null)
			expect(top.ok && top.data.subfolders.map((f) => f.name)).toEqual(["Board"])
		})

		it("keeps restricted folders and their files out of non-members' views", async () => {
			const board = await folder("Board")
			const exec = await folder("Executive Committee", board)
			await db.update(libraryFolder).set({ isRestricted: true }).where(eq(libraryFolder.id, exec))
			await db.insert(libraryFolderMember).values({ folderId: exec, userId: alice.id })
			const up = await uploadFile(db, storage, alice, {
				folderId: exec,
				name: "Salaries.pdf",
				bytes: pdf(),
				mode: "new",
			})
			if (!up.ok) throw new Error(up.error)

			const bobBoard = await getFolderView(db, bob, board)
			expect(bobBoard.ok && bobBoard.data.subfolders).toEqual([])
			expect(bobBoard.ok && bobBoard.data.tree.map((f) => f.name)).toEqual(["Board"])
			expect(await getFolderView(db, bob, exec)).toMatchObject({ ok: false, code: "not_found" })
			expect(await getFileView(db, bob, up.data.fileId)).toMatchObject({
				ok: false,
				code: "not_found",
			})
			expect(
				await uploadVersion(db, storage, bob, {
					fileId: up.data.fileId,
					name: "x.pdf",
					bytes: pdf(),
				}),
			).toMatchObject({ ok: false, code: "not_found" })
			expect((await getFileView(db, alice, up.data.fileId)).ok).toBe(true)
		})
	})

	describe("search", () => {
		const text = (s: string) => new TextEncoder().encode(s)

		async function add(folderId: number, name: string, body: string) {
			const up = await uploadFile(db, storage, alice, {
				folderId,
				name,
				bytes: text(body),
				mode: "new",
			})
			if (!up.ok) throw new Error(up.error)
			await indexVersion(db, up.data.versionId, name, text(body))
			return up.data
		}

		it("finds files by name and by contents, with path and snippet", async () => {
			const board = await folder("Board")
			const minutes = await folder("Minutes", board)
			await add(minutes, "2026-03.txt", "Motion carried: the Clasen Cup moves to Keller.")
			await add(minutes, "Clasen Cup schedule.txt", "Dates TBD")
			await add(board, "Unrelated.txt", "Nothing to see")

			const result = await searchLibrary(db, alice, "clasen")
			if (!result.ok) throw new Error(result.error)
			expect(result.data.map((r) => r.name)).toEqual(["Clasen Cup schedule.txt", "2026-03.txt"])
			expect(result.data[1]).toMatchObject({
				path: "Board / Minutes",
				snippet: "Motion carried: the Clasen Cup moves to Keller.",
			})
			expect(result.data[0]?.snippet).toBeNull()
		})

		it("requires every term and ignores case and accents", async () => {
			const id = await folder("Board")
			await add(id, "a.txt", "The Résumé committee met in June")
			await add(id, "b.txt", "The resume was filed")
			const both = await searchLibrary(db, alice, "RESUME june")
			expect(both.ok && both.data.map((r) => r.name)).toEqual(["a.txt"])
			const literal = await searchLibrary(db, alice, "50%")
			expect(literal.ok && literal.data).toEqual([])
		})

		it("only returns files the searcher can see, and never Trash", async () => {
			const board = await folder("Board")
			const exec = await folder("Executive Committee", board)
			await db.update(libraryFolder).set({ isRestricted: true }).where(eq(libraryFolder.id, exec))
			await db.insert(libraryFolderMember).values({ folderId: exec, userId: alice.id })
			await add(exec, "salaries.txt", "Confidential compensation figures")
			const trashed = await add(board, "old.txt", "Confidential draft")
			await db
				.update(libraryFile)
				.set({ deletedAt: new Date() })
				.where(eq(libraryFile.id, trashed.fileId))

			const forAlice = await searchLibrary(db, alice, "confidential")
			expect(forAlice.ok && forAlice.data.map((r) => r.name)).toEqual(["salaries.txt"])
			const forBob = await searchLibrary(db, bob, "confidential")
			expect(forBob.ok && forBob.data).toEqual([])
		})

		it("searches the current version and gives restored versions their text", async () => {
			const id = await folder("Board")
			const v1 = await add(id, "agenda.txt", "Original wording about golf carts")
			const v2 = await uploadFile(db, storage, alice, {
				folderId: id,
				name: "agenda.txt",
				bytes: text("New wording about tee times"),
				mode: "newVersion",
			})
			if (!v2.ok) throw new Error(v2.error)
			await indexVersion(db, v2.data.versionId, "agenda.txt", text("New wording about tee times"))
			const old = await searchLibrary(db, alice, "carts")
			expect(old.ok && old.data).toEqual([])

			// Simulate the copy that restoring v1 performs.
			const [restored] = await db
				.insert(libraryFileVersion)
				.values({
					fileId: v1.fileId,
					versionNo: 3,
					s3Key: "library/x",
					size: 1,
					contentType: "text/plain",
					originalName: "agenda.txt",
					uploadedBy: admin.id,
					uploadedAt: new Date(),
					restoredFromVersionId: v1.versionId,
				})
				.$returningId()
			await copyVersionText(db, v1.versionId, restored!.id)
			await db
				.update(libraryFile)
				.set({ currentVersionId: restored!.id })
				.where(eq(libraryFile.id, v1.fileId))
			const again = await searchLibrary(db, alice, "carts")
			expect(again.ok && again.data.map((r) => r.name)).toEqual(["agenda.txt"])
		})
	})
})
