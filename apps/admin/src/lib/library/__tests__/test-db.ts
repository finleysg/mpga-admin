import { createDb, type Database } from "@mpga/database"
import { createConnection, type Connection } from "mysql2/promise"

const config = {
	host: "127.0.0.1",
	port: Number(process.env.TEST_DATABASE_PORT),
	user: "root",
	password: "mpga-test-only",
	database: "mpga_security_test",
}

/** Setup waits for the shared lock while other library test files run; allow for that. */
export const LOCK_WAIT_MS = 300_000

/**
 * Library integration test files truncate the same tables, and Vitest runs files in parallel.
 * Each file holds this named lock (on its own connection) for its whole run, so they take turns.
 */
export async function openLibraryTestDb(): Promise<{
	db: Database
	close: () => Promise<void>
}> {
	const lock: Connection = await createConnection(config)
	await lock.query("SELECT GET_LOCK('mpga-library-integration-tests', 300)")
	const db = createDb(config)
	return {
		db,
		close: async () => {
			await db.$client.end()
			await lock.query("SELECT RELEASE_LOCK('mpga-library-integration-tests')")
			await lock.end()
		},
	}
}
