// @vitest-environment node
import { document, libraryPublication } from "@mpga/database"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

// lib/documents uses the app's db and S3; point the db at the disposable test schema and never
// touch a real bucket.
vi.mock("../../db", async () => {
	const { createDb } = await import("@mpga/database")
	return {
		db: createDb({
			host: "127.0.0.1",
			port: Number(process.env.TEST_DATABASE_PORT ?? 25062),
			user: "root",
			password: "mpga-test-only",
			database: "mpga_security_test",
		}),
	}
})
vi.mock("../../s3", () => ({ uploadToS3: vi.fn(), deleteFromS3: vi.fn() }))

import { openLibraryTestDb } from "./test-db"
import { db } from "../../db"
import { deleteDocument, uploadDocumentFile } from "../../documents"
import { deleteFromS3 } from "../../s3"

describe.skipIf(!process.env.TEST_DATABASE_PORT)(
	"legacy document links to the library (MySQL)",
	() => {
		// Take turns with the other library test files, which clear these tables.
		let release: () => Promise<void>
		beforeAll(async () => {
			;({ close: release } = await openLibraryTestDb())
		})
		afterAll(async () => {
			await release()
		})

		async function publishedDocument() {
			const [doc] = await db.insert(document).values({
				title: "Linked",
				documentType: "Other",
				lastUpdate: "2026-01-01 00:00:00",
				createdBy: "test",
				file: "documents/old.pdf",
			})
			const id = doc.insertId
			// version_id has a foreign key; skip the check for this isolated row. Session settings
			// are per connection, so do it inside one transaction.
			await db.transaction(async (tx) => {
				await tx.execute(`SET FOREIGN_KEY_CHECKS = 0`)
				await tx.insert(libraryPublication).values({
					documentId: id,
					versionId: 999999,
					publishedBy: "test",
					publishedAt: new Date(),
				})
				await tx.execute(`SET FOREIGN_KEY_CHECKS = 1`)
			})
			return id
		}

		const links = (id: number) =>
			db.select().from(libraryPublication).where(eq(libraryPublication.documentId, id))

		it("drops the library link when a file is uploaded directly", async () => {
			const id = await publishedDocument()
			const file = new File([new Uint8Array([1, 2, 3])], "direct.pdf", { type: "application/pdf" })
			await uploadDocumentFile(file, id)
			expect(await links(id)).toHaveLength(0)
			await deleteDocument(id)
		})

		it("keeps a public file that another document still uses", async () => {
			const first = await publishedDocument()
			const second = await publishedDocument()
			vi.mocked(deleteFromS3).mockClear()
			await deleteDocument(first)
			expect(deleteFromS3).not.toHaveBeenCalled()
			await deleteDocument(second)
			expect(deleteFromS3).toHaveBeenCalledWith("documents/old.pdf")
		})

		it("drops the library link when the document is deleted", async () => {
			const id = await publishedDocument()
			await deleteDocument(id)
			expect(await links(id)).toHaveLength(0)
			expect(await db.select().from(document).where(eq(document.id, id))).toHaveLength(0)
		})
	},
)
