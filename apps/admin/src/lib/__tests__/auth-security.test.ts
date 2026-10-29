// @vitest-environment node
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { describe, expect, it, vi } from "vitest"

vi.mock("../db", () => ({ db: {} }))
vi.mock("better-auth/adapters/drizzle", () => ({
	drizzleAdapter: () => memoryAdapter({ user: [], session: [], account: [], verification: [] }),
}))
vi.mock("../email", () => ({ sendSignInOtpEmail: vi.fn() }))
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
