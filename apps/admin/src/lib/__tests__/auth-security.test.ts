// @vitest-environment node
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { describe, expect, it, vi } from "vitest"

vi.mock("../db", () => ({ db: {} }))
vi.mock("better-auth/adapters/drizzle", () => ({
	drizzleAdapter: () => memoryAdapter({ user: [], session: [], account: [], verification: [] }),
}))
vi.mock("../email", () => ({ sendSignInOtpEmail: vi.fn(), sendPasswordResetEmail: vi.fn() }))
import { auth } from "../auth"

function testAuth() {
	const store = { user: [], session: [], account: [], verification: [] }
	return {
		store,
		instance: betterAuth({
			...auth.options,
			database: memoryAdapter(store),
			baseURL: "http://localhost:4100",
			secret: "test-only-secret-with-at-least-thirty-two-characters",
			rateLimit: { enabled: false },
		}),
	}
}

describe("admin registration boundary", () => {
	it("rejects direct public password signup even when an admin role is supplied", async () => {
		const { instance, store } = testAuth()
		const response = await instance.handler(
			new Request("http://localhost:4100/api/auth/sign-up/email", {
				method: "POST",
				headers: { "content-type": "application/json", origin: "http://localhost:4100" },
				body: JSON.stringify({
					name: "Uninvited",
					email: "uninvited@example.com",
					password: "password123456",
					role: "admin",
				}),
			}),
		)
		expect(response.ok).toBe(false)
		expect(store.user).toHaveLength(0)
		expect(store.account).toHaveLength(0)
		expect(store.session).toHaveLength(0)
	})
	it("preserves password login and role for a provisioned account", async () => {
		const { instance } = testAuth()
		await instance.api.createUser({
			body: {
				name: "Provisioned",
				email: "provisioned@example.com",
				password: "password123456",
				role: "admin",
			},
		})
		const response = await instance.handler(
			new Request("http://localhost:4100/api/auth/sign-in/email", {
				method: "POST",
				headers: { "content-type": "application/json", origin: "http://localhost:4100" },
				body: JSON.stringify({ email: "provisioned@example.com", password: "password123456" }),
			}),
		)
		expect(response.ok).toBe(true)
		const body = await response.json()
		expect(body.user.role).toBe("admin")
		expect(body.token).toBeTruthy()
	})

	it("does not send an OTP that could create an uninvited account", async () => {
		const { instance, store } = testAuth()
		const { sendSignInOtpEmail } = await import("../email")
		vi.mocked(sendSignInOtpEmail).mockClear()
		await instance.api.sendVerificationOTP({
			body: { email: "uninvited@example.com", type: "sign-in" },
		})
		expect(sendSignInOtpEmail).not.toHaveBeenCalled()
		expect(store.user).toHaveLength(0)
	})
})

describe("password reset", () => {
	const ORIGINAL_PASSWORD = "original-password-1"
	const NEW_PASSWORD = "brand-new-password-2"
	type Instance = ReturnType<typeof testAuth>["instance"]

	async function provision(instance: Instance, role: string) {
		const email = `${role}-${Math.random().toString(36).slice(2)}@example.com`
		const { user } = await instance.api.createUser({
			body: { name: role, email, password: ORIGINAL_PASSWORD, role: role as "admin" },
		})
		return { id: user.id, email }
	}

	function signIn(instance: Instance, email: string, password: string) {
		return instance.handler(
			new Request("http://localhost:4100/api/auth/sign-in/email", {
				method: "POST",
				headers: { "content-type": "application/json", origin: "http://localhost:4100" },
				body: JSON.stringify({ email, password }),
			}),
		)
	}

	async function resetEmailMock() {
		const { sendPasswordResetEmail } = await import("../email")
		vi.mocked(sendPasswordResetEmail).mockClear()
		return vi.mocked(sendPasswordResetEmail)
	}

	it("emails board members a single-use link to the admin reset page", async () => {
		const { instance } = testAuth()
		const sendEmail = await resetEmailMock()
		const board = await provision(instance, "board")

		await instance.api.requestPasswordReset({ body: { email: board.email } })

		expect(sendEmail).toHaveBeenCalledTimes(1)
		const [to, link] = sendEmail.mock.calls[0]!
		expect(to).toBe(board.email)
		expect(link).toMatch(/^http:\/\/localhost:4100\/reset-password\?token=[\w-]+$/)
	})

	it("never emails a reset link to portal users, banned users or unknown addresses", async () => {
		const { instance, store } = testAuth()
		const sendEmail = await resetEmailMock()
		const portal = await provision(instance, "user")
		const banned = await provision(instance, "admin")
		const bannedRow = (store.user as { id: string; banned?: boolean }[]).find(
			(u) => u.id === banned.id,
		)!
		bannedRow.banned = true

		for (const email of [portal.email, banned.email, "nobody@example.com"]) {
			await instance.api.requestPasswordReset({ body: { email } })
		}

		expect(sendEmail).not.toHaveBeenCalled()
	})

	it("answers the public forgot-password request identically for every address", async () => {
		const { instance } = testAuth()
		const sendEmail = await resetEmailMock()
		const board = await provision(instance, "board")
		const portal = await provision(instance, "user")

		const request = async (email: string) => {
			const response = await instance.handler(
				new Request("http://localhost:4100/api/auth/request-password-reset", {
					method: "POST",
					headers: { "content-type": "application/json", origin: "http://localhost:4100" },
					body: JSON.stringify({ email }),
				}),
			)
			return { status: response.status, body: await response.json() }
		}
		const answers = [
			await request(board.email),
			await request(portal.email),
			await request("nobody@example.com"),
		]

		expect(answers[0]!.status).toBe(200)
		expect(answers[1]).toEqual(answers[0])
		expect(answers[2]).toEqual(answers[0])
		expect(sendEmail).toHaveBeenCalledTimes(1)
		expect(sendEmail.mock.calls[0]![0]).toBe(board.email)
	})

	it("sets the new password, ends existing sessions and refuses to reuse the link", async () => {
		const { instance, store } = testAuth()
		const sendEmail = await resetEmailMock()
		const admin = await provision(instance, "admin")
		expect((await signIn(instance, admin.email, ORIGINAL_PASSWORD)).ok).toBe(true)
		const sessions = () =>
			(store.session as { userId: string }[]).filter((s) => s.userId === admin.id)
		expect(sessions()).toHaveLength(1)

		await instance.api.requestPasswordReset({ body: { email: admin.email } })
		const token = new URL(sendEmail.mock.calls[0]![1]).searchParams.get("token")!
		await instance.api.resetPassword({ body: { newPassword: NEW_PASSWORD, token } })

		expect(sessions()).toHaveLength(0)
		expect((await signIn(instance, admin.email, ORIGINAL_PASSWORD)).ok).toBe(false)
		expect((await signIn(instance, admin.email, NEW_PASSWORD)).ok).toBe(true)
		await expect(
			instance.api.resetPassword({ body: { newPassword: "another-password-3", token } }),
		).rejects.toThrow()
	})
})
