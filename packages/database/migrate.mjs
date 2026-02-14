import { createConnection } from "mysql2/promise"
import { readFileSync } from "fs"
import { join } from "path"

const migrationsDir = join(process.cwd(), "packages/database/drizzle")

async function migrate() {
	const connection = await createConnection({
		host: process.env.DATABASE_HOST,
		port: parseInt(process.env.DATABASE_PORT || "3306", 10),
		user: process.env.DATABASE_USER,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_NAME,
		multipleStatements: false,
	})

	await connection.execute(`
		CREATE TABLE IF NOT EXISTS __drizzle_migrations (
			id SERIAL PRIMARY KEY,
			hash TEXT NOT NULL,
			created_at BIGINT
		)
	`)

	const journal = JSON.parse(readFileSync(join(migrationsDir, "meta/_journal.json"), "utf-8"))

	const [rows] = await connection.execute("SELECT hash FROM __drizzle_migrations")
	const applied = new Set(rows.map((r) => r.hash))

	for (const entry of journal.entries) {
		if (!applied.has(entry.tag)) {
			const sql = readFileSync(join(migrationsDir, `${entry.tag}.sql`), "utf-8")
			const statements = sql
				.split("--> statement-breakpoint")
				.map((s) => s.trim())
				.filter(Boolean)
			for (const stmt of statements) {
				await connection.execute(stmt)
			}
			await connection.execute(
				"INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
				[entry.tag, Date.now()],
			)
			console.log(`Applied migration: ${entry.tag}`)
		}
	}

	await connection.end()
	console.log("Migrations complete")
}

migrate().catch((err) => {
	console.error("Migration failed:", err)
	process.exit(1)
})
