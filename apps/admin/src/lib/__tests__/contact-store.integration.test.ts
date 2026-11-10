// @vitest-environment node
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"

import { contactGuard, message } from "@mpga/database"
import { eq, sql } from "drizzle-orm"
import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("../db", async () => {
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
import { contactKey } from "../contact-protection"
import { storeContact } from "../contact-store"
import { db } from "../db"

// Never connect to the application's schema. Uses the existing disposable test DB convention.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("contact guards (MySQL)", () => {
	beforeAll(async () => {
		const migration = readFileSync(
			new URL("../../../../../packages/database/drizzle/0006_wet_microbe.sql", import.meta.url),
			"utf8",
		)
		await db.execute(
			sql.raw(
				migration
					.split("--> statement-breakpoint")[0]!
					.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS"),
			),
		)
		await db.execute(
			sql.raw(
				"CREATE TABLE IF NOT EXISTS message (id INT AUTO_INCREMENT PRIMARY KEY, messageDate DATETIME(6) NOT NULL, contactEmail VARCHAR(254) NOT NULL, contactName VARCHAR(100) NOT NULL, contactPhone VARCHAR(20) NOT NULL, course VARCHAR(100), message LONGTEXT NOT NULL)",
			),
		)
	})
	function data() {
		return {
			contactName: "Visitor",
			contactEmail: `${randomUUID()}@example.com`,
			contactPhone: "",
			course: "",
			message: "Hello",
			website: "",
			turnstileToken: "token",
		}
	}
	it("stores one message for concurrent duplicate submissions", async () => {
		const submission = data()
		const results = await Promise.all(
			Array.from({ length: 6 }, () => storeContact(submission, randomUUID())),
		)
		expect(results.filter((r) => r === "stored")).toHaveLength(1)
		expect(results.filter((r) => r === "duplicate")).toHaveLength(5)
		expect(
			await db.select().from(message).where(eq(message.contactEmail, submission.contactEmail)),
		).toHaveLength(1)
	})
	it("allows at most three concurrent messages per IP, even with different emails", async () => {
		const ip = randomUUID()
		const results = await Promise.all(Array.from({ length: 8 }, () => storeContact(data(), ip)))
		expect(results.filter((r) => r === "stored")).toHaveLength(3)
		expect(results.filter((r) => r === "limited")).toHaveLength(5)
	})
	it("limits a normalized email across different IPs", async () => {
		const submission = data()
		for (let i = 0; i < 3; i++)
			expect(await storeContact({ ...submission, message: String(i) }, randomUUID())).toBe("stored")
		expect(await storeContact({ ...submission, message: "fourth" }, randomUUID())).toBe("limited")
	})
	it("allows submissions after the IP window expires", async () => {
		const ip = randomUUID()
		await db
			.insert(contactGuard)
			.values({ key: `ip:${contactKey(ip)}`, count: 3, expiresAt: new Date(Date.now() - 1000) })
		expect(await storeContact(data(), ip)).toBe("stored")
	})
})
