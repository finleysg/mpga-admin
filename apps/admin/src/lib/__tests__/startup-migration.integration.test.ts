// @vitest-environment node
import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const exec = promisify(execFile)
const cwd = fileURLToPath(new URL("../../../../../", import.meta.url))
const database = "mpga_startup_migration_test"

describe.skipIf(!process.env.TEST_DATABASE_PORT)("admin startup migration (MySQL)", () => {
	let connection: Connection
	beforeAll(async () => {
		connection = await createConnection({
			host: "127.0.0.1",
			port: Number(process.env.TEST_DATABASE_PORT),
			user: "root",
			password: "mpga-test-only",
		})
		await connection.execute(`CREATE DATABASE ${database}`)
	})
	afterAll(async () => {
		if (connection) {
			await connection.execute(`DROP DATABASE ${database}`)
			await connection.end()
		}
	})
	// Mirrors apps/admin/start.sh.
	function run(tags = ["0006_wet_microbe", "0007_library"]) {
		const args = tags.map((tag) => `--only=${tag}`)
		return exec(process.execPath, ["packages/database/migrate.mjs", ...args], {
			cwd,
			env: {
				...process.env,
				DATABASE_HOST: "127.0.0.1",
				DATABASE_PORT: process.env.TEST_DATABASE_PORT,
				DATABASE_USER: "root",
				DATABASE_PASSWORD: "mpga-test-only",
				DATABASE_NAME: database,
			},
		})
	}
	it("serializes concurrent startup, skips historical migrations, and repeats safely", async () => {
		const results = await Promise.all([run(), run()])
		expect(results.filter((r) => r.stdout.includes("Applied migration:"))).toHaveLength(1)
		const [tables] = await connection.query<RowDataPacket[]>(`SHOW TABLES FROM ${database}`)
		expect(tables.map((r) => Object.values(r)[0]).sort()).toEqual([
			"__drizzle_migrations",
			"contactGuard",
			"library_audit",
			"library_file",
			"library_file_text",
			"library_file_version",
			"library_folder",
			"library_folder_member",
			"library_publication",
		])
		const [indexes] = await connection.query<RowDataPacket[]>(
			`SHOW INDEX FROM ${database}.contactGuard`,
		)
		expect(indexes.map((r) => r.Key_name)).toContain("contactGuard_expiry")
		expect((await run()).stdout).not.toContain("Applied migration:")
		const [records] = await connection.query<RowDataPacket[]>(
			`SELECT hash FROM ${database}.__drizzle_migrations`,
		)
		expect(records.map((r) => r.hash).sort()).toEqual(["0006_wet_microbe", "0007_library"])
	})
	it("recovers if DDL completed before its journal record was written", async () => {
		await connection.execute(`DELETE FROM ${database}.__drizzle_migrations`)
		const { stdout } = await run()
		expect(stdout).toContain("Applied migration: 0006_wet_microbe")
		expect(stdout).toContain("Applied migration: 0007_library")
	})
	it("fails instead of falling back to historical migrations for an invalid tag", async () => {
		await expect(run(["unknown"])).rejects.toMatchObject({ code: 1 })
		await expect(run(["0007_library", "unknown"])).rejects.toMatchObject({ code: 1 })
	})
})
