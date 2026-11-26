// @vitest-environment node
import {
	libraryAudit,
	libraryFile,
	libraryFileVersion,
	libraryFolder,
	user,
	type Database,
} from "@mpga/database"
import { and, eq, inArray, sql } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import type { Viewer } from "../access"
import {
	deleteFile,
	deleteFolder,
	listTrash,
	moveFile,
	moveFolder,
	renameFile,
	renameFolder,
	restoreFromTrash,
	restoreVersion,
	setFolderRestriction,
} from "../admin"
import { createFolder, getFileView, getFolderView, uploadFile } from "../service"
import { MemoryLibraryStorage } from "../storage"
import { openLibraryTestDb } from "./test-db"

const pdf = (body = "x") => new TextEncoder().encode(`%PDF-1.7 ${body}`)

const admin: Viewer = { id: "lib-admin-test", isDocumentAdmin: true }
const alice: Viewer = { id: "lib-alice-test", isDocumentAdmin: false }
const bob: Viewer = { id: "lib-bob-test", isDocumentAdmin: false }

// Runs only against the disposable integration schema, never the application database.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("library admin operations (MySQL)", () => {
	let db: Database
	let close: () => Promise<void>
	let storage: MemoryLibraryStorage

	beforeAll(async () => {
		;({ db, close } = await openLibraryTestDb())
		const ids = [admin.id, alice.id, bob.id]
		await db.delete(user).where(inArray(user.id, ids))
		await db.insert(user).values([
			{ id: admin.id, name: "Admin", email: `${admin.id}@example.com`, role: "admin" },
			{ id: alice.id, name: "Alice", email: `${alice.id}@example.com`, role: "board" },
			{ id: bob.id, name: "Bob", email: `${bob.id}@example.com`, role: "board" },
		])
	})

	afterAll(async () => {
		await db.delete(user).where(inArray(user.id, [admin.id, alice.id, bob.id]))
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

	async function upload(folderId: number, name: string, body = "x") {
		const result = await uploadFile(db, storage, alice, {
			folderId,
			name,
			bytes: pdf(body),
			mode: "new",
		})
		if (!result.ok) throw new Error(result.error)
		return result.data
	}

	async function lastAudit() {
		const rows = await db.select().from(libraryAudit)
		return rows.at(-1)
	}

	it("refuses every admin operation for board members", async () => {
		const id = await folder("Board")
		const file = await upload(id, "a.pdf")
		for (const result of [
			await renameFolder(db, alice, id, "X"),
			await moveFolder(db, alice, id, null),
			await setFolderRestriction(db, alice, id, { restricted: true, memberIds: [] }),
			await deleteFolder(db, alice, id),
			await renameFile(db, alice, file.fileId, "b.pdf"),
			await moveFile(db, alice, file.fileId, id),
			await deleteFile(db, alice, file.fileId),
			await restoreVersion(db, alice, file.fileId, file.versionId),
			await listTrash(db, alice),
		]) {
			expect(result).toMatchObject({ ok: false, code: "forbidden" })
		}
	})

	describe("rename", () => {
		it("renames folders and files with audit rows, and rejects clashes", async () => {
			const board = await folder("Board")
			await folder("Minutes", board)
			const agendas = await folder("Agendas", board)
			expect(await renameFolder(db, admin, agendas, "minutes")).toMatchObject({
				code: "name_conflict",
			})
			expect((await renameFolder(db, admin, agendas, "Agendas 2026")).ok).toBe(true)
			expect(await lastAudit()).toMatchObject({ action: "rename", entityId: agendas })

			const a = await upload(board, "a.pdf")
			await upload(board, "b.pdf")
			expect(await renameFile(db, admin, a.fileId, "B.pdf")).toMatchObject({
				code: "name_conflict",
			})
			expect(await renameFile(db, admin, a.fileId, "a.docx")).toMatchObject({ code: "invalid" })
			expect((await renameFile(db, admin, a.fileId, "Agenda.pdf")).ok).toBe(true)
		})
	})

	describe("move", () => {
		it("moves a folder subtree and updates depths", async () => {
			const one = await folder("One")
			const two = await folder("Two", one)
			const three = await folder("Three", two)
			const other = await folder("Other")
			expect((await moveFolder(db, admin, two, other)).ok).toBe(true)
			const rows = await db
				.select({
					id: libraryFolder.id,
					parentId: libraryFolder.parentId,
					depth: libraryFolder.depth,
				})
				.from(libraryFolder)
				.where(inArray(libraryFolder.id, [two, three]))
			expect(rows).toEqual(
				expect.arrayContaining([
					{ id: two, parentId: other, depth: 2 },
					{ id: three, parentId: two, depth: 3 },
				]),
			)
			expect((await moveFolder(db, admin, two, null)).ok).toBe(true)
			const [moved] = await db.select().from(libraryFolder).where(eq(libraryFolder.id, three))
			expect(moved?.depth).toBe(2)
		})

		it("refuses moves into itself, below itself, or past 4 levels", async () => {
			const one = await folder("One")
			const two = await folder("Two", one)
			const three = await folder("Three", two)
			await folder("Four", three)
			expect(await moveFolder(db, admin, one, one)).toMatchObject({ code: "invalid" })
			expect(await moveFolder(db, admin, one, three)).toMatchObject({ code: "invalid" })
			const deep = await folder("Deep")
			// One has 3 levels below it; under Deep it would reach level 5.
			expect(await moveFolder(db, admin, one, deep)).toMatchObject({ code: "invalid" })
		})

		it("moves files and rejects name clashes at the destination", async () => {
			const a = await folder("A")
			const b = await folder("B")
			const file = await upload(a, "Agenda.pdf")
			await upload(b, "agenda.pdf")
			expect(await moveFile(db, admin, file.fileId, b)).toMatchObject({ code: "name_conflict" })
			expect((await renameFile(db, admin, file.fileId, "Agenda v2.pdf")).ok).toBe(true)
			expect((await moveFile(db, admin, file.fileId, b)).ok).toBe(true)
			const view = await getFolderView(db, admin, b)
			expect(view.ok && view.data.files.map((f) => f.name)).toEqual(["Agenda v2.pdf", "agenda.pdf"])
		})
	})

	describe("restricted access", () => {
		it("limits a folder to chosen board members and can be lifted", async () => {
			const exec = await folder("Executive Committee")
			const file = await upload(exec, "Salaries.pdf")
			const restrict = await setFolderRestriction(db, admin, exec, {
				restricted: true,
				memberIds: [alice.id],
			})
			expect(restrict.ok).toBe(true)
			expect(await lastAudit()).toMatchObject({ action: "access_change", entityId: exec })
			expect((await getFileView(db, alice, file.fileId)).ok).toBe(true)
			expect((await getFileView(db, bob, file.fileId)).ok).toBe(false)
			expect((await getFileView(db, admin, file.fileId)).ok).toBe(true)

			expect(
				(await setFolderRestriction(db, admin, exec, { restricted: false, memberIds: [] })).ok,
			).toBe(true)
			expect((await getFileView(db, bob, file.fileId)).ok).toBe(true)
		})

		it("only accepts board members as members", async () => {
			const exec = await folder("Executive Committee")
			for (const memberIds of [[admin.id], ["no-such-user"]]) {
				expect(
					await setFolderRestriction(db, admin, exec, { restricted: true, memberIds }),
				).toMatchObject({ code: "invalid" })
			}
		})
	})

	describe("trash", () => {
		it("trashes a folder with its contents as one item and restores them together", async () => {
			const board = await folder("Board")
			const minutes = await folder("Minutes", board)
			await upload(minutes, "Jan.pdf")
			const loose = await upload(board, "Loose.pdf")
			expect((await deleteFile(db, admin, loose.fileId)).ok).toBe(true)
			expect((await deleteFolder(db, admin, board)).ok).toBe(true)

			const hidden = await getFolderView(db, alice, null)
			expect(hidden.ok && hidden.data.subfolders).toEqual([])
			const trash = await listTrash(db, admin)
			if (!trash.ok) throw new Error(trash.error)
			expect(trash.data.map((t) => [t.kind, t.name, t.folderCount, t.fileCount])).toEqual([
				["folder", "Board", 2, 1],
				["file", "Loose.pdf", 0, 1],
			])
			expect(trash.data.find((t) => t.kind === "file")?.parentIsLive).toBe(false)

			expect((await restoreFromTrash(db, admin, { kind: "folder", id: board })).ok).toBe(true)
			const back = await getFolderView(db, alice, minutes)
			expect(back.ok && back.data.files.map((f) => f.name)).toEqual(["Jan.pdf"])
			// The separately deleted file stays in Trash.
			const after = await listTrash(db, admin)
			expect(after.ok && after.data.map((t) => t.name)).toEqual(["Loose.pdf"])
		})

		it("asks where to put a file whose folder is gone, and renames on a clash", async () => {
			const board = await folder("Board")
			const other = await folder("Other")
			const file = await upload(board, "Agenda.pdf")
			await deleteFile(db, admin, file.fileId)
			await deleteFolder(db, admin, board)
			expect(await restoreFromTrash(db, admin, { kind: "file", id: file.fileId })).toMatchObject({
				code: "invalid",
			})
			await upload(other, "Agenda.pdf")
			const restored = await restoreFromTrash(db, admin, { kind: "file", id: file.fileId }, other)
			expect(restored).toMatchObject({
				ok: true,
				data: { name: "Agenda (2).pdf", folderId: other },
			})
		})

		it("restores a folder to the top level when its parent is still in Trash", async () => {
			const board = await folder("Board")
			const minutes = await folder("Minutes", board)
			await folder("2026", minutes)
			await deleteFolder(db, admin, minutes)
			await deleteFolder(db, admin, board)
			expect((await restoreFromTrash(db, admin, { kind: "folder", id: minutes })).ok).toBe(true)
			const rows = await db
				.select({
					name: libraryFolder.name,
					parentId: libraryFolder.parentId,
					depth: libraryFolder.depth,
				})
				.from(libraryFolder)
				.where(and(inArray(libraryFolder.name, ["Minutes", "2026"])))
			expect(rows).toEqual(
				expect.arrayContaining([
					{ name: "Minutes", parentId: null, depth: 1 },
					{ name: "2026", parentId: minutes, depth: 2 },
				]),
			)
		})
	})

	describe("restore version", () => {
		it("adds the old version back as a new current version", async () => {
			const board = await folder("Board")
			const v1 = await upload(board, "Agenda.pdf", "first")
			await uploadFile(db, storage, bob, {
				folderId: board,
				name: "Agenda.pdf",
				bytes: pdf("second"),
				mode: "newVersion",
			})
			const restored = await restoreVersion(db, admin, v1.fileId, v1.versionId)
			expect(restored).toMatchObject({ ok: true, data: { versionNo: 3 } })
			const versions = await db
				.select()
				.from(libraryFileVersion)
				.where(eq(libraryFileVersion.fileId, v1.fileId))
			expect(versions).toHaveLength(3)
			const v3 = versions.find((v) => v.versionNo === 3)!
			const original = versions.find((v) => v.versionNo === 1)!
			expect(v3).toMatchObject({ s3Key: original.s3Key, restoredFromVersionId: original.id })
			const [file] = await db.select().from(libraryFile).where(eq(libraryFile.id, v1.fileId))
			expect(file?.currentVersionId).toBe(v3.id)
			const view = await getFileView(db, alice, v1.fileId)
			expect(view.ok && view.data.current.restoredFromVersionNo).toBe(1)
			expect(await lastAudit()).toMatchObject({ action: "restore_version" })
		})
	})
})
