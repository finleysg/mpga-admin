import crypto from "node:crypto"

import mysql from "mysql2/promise"

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
	if (!pool) {
		pool = mysql.createPool({
			host: process.env.E2E_DB_HOST || "127.0.0.1",
			port: Number(process.env.E2E_DB_PORT) || 25061,
			user: process.env.E2E_DB_USER || "root",
			password: process.env.E2E_DB_PASSWORD || "",
			database: process.env.E2E_DB_NAME || "mpga-data",
			waitForConnections: true,
			connectionLimit: 2,
		})
	}
	return pool
}

export async function closePool(): Promise<void> {
	if (pool) {
		await pool.end()
		pool = null
	}
}

/**
 * Seeds an invitation row in the DB.
 * Returns the plain (unhashed) token for use in the browser URL.
 */
export async function seedInvitation(email: string, invitedByUserId: string): Promise<string> {
	const db = getPool()
	const id = crypto.randomUUID()
	const plainToken = crypto.randomBytes(32).toString("hex")
	const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex")

	const now = new Date()
	const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

	await db.execute(
		`INSERT INTO invitation (id, email, token, invited_by, role, status, expires_at, created_at)
		 VALUES (?, ?, ?, ?, 'admin', 'pending', ?, ?)`,
		[id, email, hashedToken, invitedByUserId, expiresAt, now],
	)

	return plainToken
}

/**
 * Cleans up all test data for a given email address.
 * Deletes from session, account, user, and invitation tables.
 */
export async function cleanupTestUser(email: string): Promise<void> {
	const db = getPool()

	// Find the user ID first
	const [users] = await db.execute<mysql.RowDataPacket[]>("SELECT id FROM user WHERE email = ?", [
		email,
	])

	if (users.length > 0) {
		const userId = users[0]!.id
		await db.execute("DELETE FROM session WHERE user_id = ?", [userId])
		await db.execute("DELETE FROM account WHERE user_id = ?", [userId])
		await db.execute("DELETE FROM user WHERE id = ?", [userId])
	}

	await db.execute("DELETE FROM invitation WHERE email = ?", [email])
}
