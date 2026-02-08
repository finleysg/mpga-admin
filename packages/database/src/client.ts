import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

import * as schema from "./schema"

export interface DatabaseConfig {
	host: string
	port: number
	user: string
	password: string
	database: string
}

export function createDb(config: DatabaseConfig) {
	const pool = mysql.createPool({
		host: config.host,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database,
		connectionLimit: 10,
		waitForConnections: true,
		queueLimit: 0,
	})

	return drizzle(pool, { schema, mode: "default" })
}

export type Database = ReturnType<typeof createDb>
