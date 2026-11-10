// @vitest-environment node
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { store, send } = vi.hoisted(() => ({ store: vi.fn(), send: vi.fn() }))
vi.mock("../contact-store", () => ({ storeContact: store }))
vi.mock("../email", () => ({ sendContactNotificationEmail: send }))
import { POST } from "../../app/api/messages/route"
import { trustedContactRequest } from "../contact-protection"

const data = {
	contactName: " Visitor ",
	contactEmail: "Visitor@example.com",
	message: "Hello",
	turnstileToken: "token",
}
const fetchMock = vi.fn()
function request(body: unknown = data, headers: Record<string, string> = {}) {
	return new NextRequest("https://admin.example.com/api/messages", {
		method: "POST",
		body: JSON.stringify(body),
		headers: {
			"content-type": "application/json",
			"x-contact-secret": "shared-secret",
			"x-contact-ip": "192.0.2.1",
			...headers,
		},
	})
}
beforeEach(() => {
	vi.stubEnv("CONTACT_FORM_SECRET", "shared-secret")
	vi.stubEnv("TURNSTILE_SECRET_KEY", "private-key")
	vi.stubEnv("TURNSTILE_HOSTNAMES", "mpga.net,www.mpga.net")
	vi.stubGlobal("fetch", fetchMock)
	fetchMock.mockResolvedValue(
		Response.json({ success: true, hostname: "mpga.net", action: "contact" }),
	)
	store.mockResolvedValue("stored")
	send.mockResolvedValue(undefined)
})
afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
	vi.resetAllMocks()
})

describe("contact email boundary", () => {
	it.each(["", "wrong-secret", "ééééééééééééé"])(
		"blocks direct requests with secret %s",
		async (secret) => {
			expect((await POST(request(data, { "x-contact-secret": secret }))).status).toBe(403)
			expect(fetchMock).not.toHaveBeenCalled()
			expect(store).not.toHaveBeenCalled()
			expect(send).not.toHaveBeenCalled()
		},
	)
	it("fails closed without server credentials", async () => {
		vi.stubEnv("CONTACT_FORM_SECRET", "")
		expect(trustedContactRequest(new Headers({ "x-contact-secret": "" }))).toBe(false)
		vi.stubEnv("CONTACT_FORM_SECRET", "shared-secret")
		vi.stubEnv("TURNSTILE_SECRET_KEY", "")
		expect((await POST(request())).status).toBe(400)
		expect(send).not.toHaveBeenCalled()
	})
	it.each([
		null,
		[],
		{},
		{ ...data, contactName: 123 },
		{ ...data, contactEmail: "bad" },
		{ ...data, message: " " },
		{ ...data, message: "x".repeat(5001) },
		{ ...data, turnstileToken: "" },
	])("rejects invalid input %#", async (body) => {
		expect((await POST(request(body))).status).toBe(400)
		expect(store).not.toHaveBeenCalled()
		expect(send).not.toHaveBeenCalled()
	})
	it("rejects oversized bodies", async () => {
		expect((await POST(request({ ...data, message: "x".repeat(16001) }))).status).toBe(413)
	})
	it("rejects a forwarding chain instead of a single IP", async () => {
		expect((await POST(request(data, { "x-contact-ip": "192.0.2.1, 192.0.2.2" }))).status).toBe(400)
	})
	it("silently discards the honeypot", async () => {
		expect((await POST(request({ ...data, website: "spam.example" }))).status).toBe(200)
		expect(fetchMock).not.toHaveBeenCalled()
		expect(store).not.toHaveBeenCalled()
		expect(send).not.toHaveBeenCalled()
	})
	it.each([
		{ success: false, "error-codes": ["timeout-or-duplicate"] },
		{ success: true, hostname: "evil.example", action: "contact" },
		{ success: true, hostname: "mpga.net", action: "login" },
		{ success: true },
	])("rejects failed, replayed, or mismatched verification %#", async (result) => {
		fetchMock.mockResolvedValue(Response.json(result))
		expect((await POST(request())).status).toBe(400)
		expect(store).not.toHaveBeenCalled()
		expect(send).not.toHaveBeenCalled()
	})
	it("fails closed when verification is unavailable", async () => {
		fetchMock.mockRejectedValue(new Error("timeout"))
		expect((await POST(request())).status).toBe(400)
		expect(store).not.toHaveBeenCalled()
		expect(send).not.toHaveBeenCalled()
	})
	it("sends only after verification and storage, with normalized input", async () => {
		expect((await POST(request())).status).toBe(200)
		expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
			secret: "private-key",
			response: "token",
			remoteip: "192.0.2.1",
		})
		expect(send).toHaveBeenCalledExactlyOnceWith("Visitor", "visitor@example.com", "", "Hello", "")
		expect(store.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0]!)
	})
	it.each(["limited", "duplicate"])("does not email when storage reports %s", async (result) => {
		store.mockResolvedValue(result)
		const response = await POST(request())
		expect(response.status).toBe(result === "limited" ? 429 : 200)
		if (result === "limited") expect(response.headers.get("Retry-After")).toBe("600")
		expect(send).not.toHaveBeenCalled()
	})
})
