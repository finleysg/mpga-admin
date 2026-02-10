import { createDb, type Database } from "@mpga/database"

const globalForDb = globalThis as unknown as {
	db: Database | undefined
}

export const db =
	globalForDb.db ??
	(globalForDb.db = createDb({
		host: process.env.DATABASE_HOST!,
		port: parseInt(process.env.DATABASE_PORT!, 10),
		user: process.env.DATABASE_USER!,
		password: process.env.DATABASE_PASSWORD!,
		database: process.env.DATABASE_NAME!,
	}))
