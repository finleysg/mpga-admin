// @vitest-environment node
import { execFile } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

const exec = promisify(execFile)
const cwd = fileURLToPath(new URL("../../../../../", import.meta.url))
const database = "mpga_startup_migration_test"
const journal = JSON.parse(
	readFileSync(
		new URL("../../../../../packages/database/drizzle/meta/_journal.json", import.meta.url),
		"utf-8",
	),
) as { entries: { tag: string; when: number }[] }
const allTags = journal.entries.map((e) => e.tag)
const latest = allTags.at(-1)!

describe.skipIf(!process.env.TEST_DATABASE_PORT)("admin startup migration (MySQL)", () => {
	let connection: Connection
	beforeAll(async () => {
		connection = await createConnection({
			host: "127.0.0.1",
			port: Number(process.env.TEST_DATABASE_PORT),
			user: "root",
			password: "mpga-test-only",
			multipleStatements: true,
		})
	})
	beforeEach(async () => {
		await connection.query(`DROP DATABASE IF EXISTS ${database}; CREATE DATABASE ${database}`)
	})
	afterAll(async () => {
		if (connection) {
			await connection.query(`DROP DATABASE IF EXISTS ${database}`)
			await connection.end()
		}
	})

	// Mirrors apps/admin/start.sh (no arguments: every unrecorded journal migration).
	function run(args: string[] = []) {
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
	async function recorded() {
		const [rows] = await connection.query<RowDataPacket[]>(
			`SELECT hash FROM ${database}.__drizzle_migrations ORDER BY id`,
		)
		return rows.map((r) => r.hash as string)
	}
	async function tables() {
		const [rows] = await connection.query<RowDataPacket[]>(`SHOW TABLES FROM ${database}`)
		return rows.map((r) => Object.values(r)[0] as string).sort()
	}

	it("builds a fresh database from the whole journal, once, even with concurrent starts", async () => {
		const results = await Promise.all([run(), run()])
		const appliers = results.filter((r) => r.stdout.includes("Applied migration:"))
		expect(appliers).toHaveLength(1)
		expect(await recorded()).toEqual(allTags)
		expect(await tables()).toEqual(
			expect.arrayContaining(["document", "user", "contactGuard", "library_file", "library_audit"]),
		)
		expect((await run()).stdout).not.toContain("Applied migration:")
	})

	it("applies only unrecorded migrations to a database like production", async () => {
		// Production records every migration it has; simulate one that's one migration behind.
		await run()
		await connection.query(
			`SET FOREIGN_KEY_CHECKS = 0;
			 DROP TABLE ${database}.library_file_text, ${database}.library_publication,
			   ${database}.library_file_version, ${database}.library_file,
			   ${database}.library_folder_member, ${database}.library_folder, ${database}.library_audit;
			 SET FOREIGN_KEY_CHECKS = 1;
			 DELETE FROM ${database}.__drizzle_migrations WHERE hash = '${latest}'`,
		)
		const { stdout } = await run()
		expect(stdout.match(/Applied migration: \S+/g)).toEqual([`Applied migration: ${latest}`])
		expect(await recorded()).toEqual(allTags)
	})

	it("pins the library tables' character set and collation", async () => {
		await run()
		const [rows] = await connection.query<RowDataPacket[]>(
			`SELECT DISTINCT table_collation AS c FROM information_schema.tables
			 WHERE table_schema = '${database}' AND table_name LIKE 'library\\_%'`,
		)
		expect(rows.map((r) => r.c)).toEqual(["utf8mb4_0900_ai_ci"])
	})

	it("recovers if a migration's DDL completed before its record was written", async () => {
		await run()
		await connection.query(`DELETE FROM ${database}.__drizzle_migrations WHERE hash = '${latest}'`)
		// The library migration is CREATE TABLE IF NOT EXISTS, so it can be safely re-run.
		expect((await run()).stdout).toContain(`Applied migration: ${latest}`)
		expect(await recorded()).toEqual(allTags)
	})

	it("refuses to replay the journal over tables that have no migration records", async () => {
		await connection.query(`CREATE TABLE ${database}.document (id int PRIMARY KEY)`)
		await expect(run()).rejects.toMatchObject({
			code: 1,
			stderr: expect.stringContaining("has tables but no recorded migrations"),
		})
		expect(await tables()).toEqual(["__drizzle_migrations", "document"])
	})

	it("still applies specific migrations with --only, and rejects unknown tags", async () => {
		const { stdout } = await run([`--only=${latest}`])
		expect(stdout.match(/Applied migration: \S+/g)).toEqual([`Applied migration: ${latest}`])
		await expect(run(["--only=unknown"])).rejects.toMatchObject({ code: 1 })
		await expect(run([`--only=${latest}`, "--only=unknown"])).rejects.toMatchObject({ code: 1 })
	})
})
