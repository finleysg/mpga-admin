// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const { incoming } = vi.hoisted(() => ({ incoming: vi.fn() }))
vi.mock("next/headers", () => ({ headers: incoming }))
import { submitContactForm } from "../actions"
const fetchMock = vi.fn()
const data = {
	contactName: "Visitor",
	contactEmail: "visitor@example.com",
	contactPhone: "",
	course: "",
	message: "Hello",
	website: "",
	turnstileToken: "token",
}
beforeEach(() => {
	vi.stubEnv("CONTACT_FORM_SECRET", "shared")
	vi.stubEnv("CONTACT_CLIENT_IP_HEADER", "x-real-ip")
	vi.stubGlobal("fetch", fetchMock)
	incoming.mockResolvedValue(
		new Headers({ "x-real-ip": "192.0.2.1", "x-contact-ip": "evil", "x-forwarded-for": "spoof" }),
	)
	fetchMock.mockResolvedValue(Response.json({ success: true }))
})
afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
	vi.resetAllMocks()
})
it("forwards only the configured ingress IP and authenticates the server request", async () => {
	expect(await submitContactForm(data)).toEqual({ success: true })
	expect(fetchMock.mock.calls[0]![1].headers).toEqual({
		"Content-Type": "application/json",
		"x-contact-secret": "shared",
		"x-contact-ip": "192.0.2.1",
	})
	expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual(data)
})
it("fails closed if ingress IP is missing", async () => {
	incoming.mockResolvedValue(new Headers({ "x-forwarded-for": "192.0.2.1" }))
	expect((await submitContactForm(data)).success).toBe(false)
	expect(fetchMock).not.toHaveBeenCalled()
})
it("shows the rate limit message returned by admin", async () => {
	fetchMock.mockResolvedValue(Response.json({ error: "Too many messages" }, { status: 429 }))
	expect(await submitContactForm(data)).toEqual({ success: false, error: "Too many messages" })
})
