import { createConnection } from "mysql2/promise"
import { readFileSync } from "fs"
import { join } from "path"

const migrationsDir = join(process.cwd(), "packages/database/drizzle")

async function migrate() {
	const journal = JSON.parse(readFileSync(join(migrationsDir, "meta/_journal.json"), "utf-8"))
	const args = process.argv.slice(2)
	// Import dependencies and read the journal without connecting to a database.
	if (args.length === 1 && args[0] === "--check") {
		console.log("Migration runtime ready")
		return
	}
	const only = args[0]?.startsWith("--only=") ? args[0].slice("--only=".length) : undefined
	if (args.length && (args.length !== 1 || !only || !journal.entries.some((e) => e.tag === only))) {
		throw new Error("Usage: migrate.mjs [--only=<journal migration tag>]")
	}
	const connection = await createConnection({
		host: process.env.DATABASE_HOST,
		port: parseInt(process.env.DATABASE_PORT || "3306", 10),
		user: process.env.DATABASE_USER,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_NAME,
		multipleStatements: false,
	})

	try {
		// Serialize rolling deployments. Closing the connection releases the lock,
		// including on error. MySQL DDL is not transactionally rolled back.
		const [locks] = await connection.execute(
			"SELECT GET_LOCK(CONCAT('mpga-migrate:', DATABASE()), 60) AS acquired",
		)
		if (locks[0]?.acquired !== 1) throw new Error("Unable to acquire database migration lock")

		await connection.execute(`
			CREATE TABLE IF NOT EXISTS __drizzle_migrations (
				id SERIAL PRIMARY KEY,
				hash TEXT NOT NULL,
				created_at BIGINT
			)
		`)
		const [rows] = await connection.execute("SELECT hash FROM __drizzle_migrations")
		const applied = new Set(rows.map((r) => r.hash))
		for (const entry of journal.entries) {
			if (only && entry.tag !== only) continue
			if (applied.has(entry.tag)) continue
			const sql = readFileSync(join(migrationsDir, `${entry.tag}.sql`), "utf-8")
			const statements = sql
				.split("--> statement-breakpoint")
				.map((s) => s.trim())
				.filter(Boolean)
			for (const stmt of statements) await connection.execute(stmt)
			await connection.execute(
				"INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
				[entry.tag, entry.when],
			)
			console.log(`Applied migration: ${entry.tag}`)
		}
		console.log("Migrations complete")
	} finally {
		await connection.end()
	}
}

migrate().catch((err) => {
	console.error("Migration failed:", err)
	process.exit(1)
})
