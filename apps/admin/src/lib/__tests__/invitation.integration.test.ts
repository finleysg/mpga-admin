// @vitest-environment node
import { randomUUID, createHash } from "node:crypto"

import { account, invitation, user } from "@mpga/database"
import { betterAuth } from "better-auth"
import { verifyPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("../email", () => ({ sendInvitationEmail: vi.fn() }))
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
import { auth } from "../auth"
import { db } from "../db"
import { registerInvitedUser } from "../invitation"

// Run only against the explicitly provisioned disposable schema, never the application database.
describe.skipIf(!process.env.TEST_DATABASE_PORT)("invitation transactions (MySQL)", () => {
	const inviter = randomUUID()
	beforeAll(async () => {
		await db.insert(user).values({
			id: inviter,
			email: `${inviter}@example.com`,
			name: "Inviter",
			role: "super_admin",
		})
	})
	async function seed(expired = false) {
		const token = randomUUID(),
			id = randomUUID(),
			email = `${id}@example.com`
		await db.insert(invitation).values({
			id,
			email,
			invitedBy: inviter,
			role: "admin",
			status: "pending",
			token: createHash("sha256").update(token).digest("hex"),
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + (expired ? -60000 : 60000)),
		})
		return { token, id, email }
	}
	it("creates a verified admin with a compatible password hash and consumes the token", async () => {
		const inv = await seed()
		await registerInvitedUser(inv.token, "Invited Admin", "secure-test-password")
		const [created] = await db.select().from(user).where(eq(user.email, inv.email))
		expect(created).toMatchObject({ role: "admin", emailVerified: true })
		const [credential] = await db.select().from(account).where(eq(account.userId, created!.id))
		expect(
			await verifyPassword({ hash: credential!.password!, password: "secure-test-password" }),
		).toBe(true)
		const instance = betterAuth({
			...auth.options,
			baseURL: "http://localhost:4100",
			secret: "test-only-secret-with-at-least-thirty-two-characters",
		})
		const response = await instance.handler(
			new Request("http://localhost:4100/api/auth/sign-in/email", {
				method: "POST",
				headers: { "content-type": "application/json", origin: "http://localhost:4100" },
				body: JSON.stringify({ email: inv.email, password: "secure-test-password" }),
			}),
		)
		expect(response.ok).toBe(true)
		expect((await response.json()).user.role).toBe("admin")
		await expect(registerInvitedUser(inv.token, "Replay", "secure-test-password")).rejects.toThrow()
	})
	it("allows only one concurrent acceptance", async () => {
		const inv = await seed()
		const results = await Promise.allSettled([
			registerInvitedUser(inv.token, "One", "secure-test-password"),
			registerInvitedUser(inv.token, "Two", "secure-test-password"),
		])
		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
		expect(await db.select().from(user).where(eq(user.email, inv.email))).toHaveLength(1)
	})
	it("rejects expired invitations without creating a user", async () => {
		const inv = await seed(true)
		await expect(
			registerInvitedUser(inv.token, "Expired", "secure-test-password"),
		).rejects.toThrow()
		expect(await db.select().from(user).where(eq(user.email, inv.email))).toHaveLength(0)
	})
	it("rolls back consumption when account creation fails", async () => {
		const inv = await seed()
		await db
			.insert(user)
			.values({ id: randomUUID(), email: inv.email, name: "Existing", role: "user" })
		await expect(
			registerInvitedUser(inv.token, "Duplicate", "secure-test-password"),
		).rejects.toThrow()
		const [remaining] = await db.select().from(invitation).where(eq(invitation.id, inv.id))
		expect(remaining?.status).toBe("pending")
	})
})
