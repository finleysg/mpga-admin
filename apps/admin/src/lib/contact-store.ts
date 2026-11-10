import { contactGuard, message } from "@mpga/database"
import { eq, lt, sql } from "drizzle-orm"

import { contactKey, type ContactSubmission } from "./contact-protection"
import { db } from "./db"

const WINDOW_MS = 10 * 60 * 1000

// Locks and reservations live in MySQL, so concurrent requests and multiple
// containers cannot bypass the limits or send duplicate notifications.
export async function storeContact(data: ContactSubmission, ip: string) {
	const now = new Date()
	// READ COMMITTED avoids expiry-index gap locks blocking concurrent inserts.
	await db.transaction(
		async (tx) => {
			await tx.delete(contactGuard).where(lt(contactGuard.expiresAt, now)).limit(100)
		},
		{ isolationLevel: "read committed" },
	)
	return db.transaction(
		async (tx) => {
			const limits = [
				{ key: `ip:${contactKey(ip)}`, max: 3, ttl: WINDOW_MS },
				{ key: `email:${contactKey(data.contactEmail)}`, max: 3, ttl: WINDOW_MS },
				{
					key: `duplicate:${contactKey(JSON.stringify([data.contactEmail, data.message]))}`,
					max: 1,
					ttl: 24 * 60 * 60 * 1000,
				},
			].sort((a, b) => a.key.localeCompare(b.key))
			const rows = []
			for (const limit of limits) {
				await tx
					.insert(contactGuard)
					.values({
						key: limit.key,
						count: 0,
						expiresAt: new Date(now.getTime() + limit.ttl),
					})
					.onDuplicateKeyUpdate({ set: { key: sql`${contactGuard.key}` } })
				const [row] = await tx
					.select()
					.from(contactGuard)
					.where(eq(contactGuard.key, limit.key))
					.for("update")
				if (!row) throw new Error("Missing contact guard")
				rows.push({
					...limit,
					count: row.expiresAt > now ? row.count : 0,
					expiresAt: row.expiresAt > now ? row.expiresAt : new Date(now.getTime() + limit.ttl),
				})
			}
			if (rows.some((r) => r.key.startsWith("duplicate:") && r.count >= r.max))
				return "duplicate" as const
			if (rows.some((r) => r.count >= r.max)) return "limited" as const
			for (const row of rows) {
				await tx
					.update(contactGuard)
					.set({ count: row.count + 1, expiresAt: row.expiresAt })
					.where(eq(contactGuard.key, row.key))
			}
			await tx.insert(message).values({
				messageDate: now.toISOString().slice(0, 23).replace("T", " "),
				contactName: data.contactName,
				contactEmail: data.contactEmail,
				contactPhone: data.contactPhone,
				course: data.course || null,
				message: data.message,
			})
			return "stored" as const
		},
		{ isolationLevel: "read committed" },
	)
}
