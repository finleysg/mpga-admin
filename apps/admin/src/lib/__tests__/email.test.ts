// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
const { create, smtp } = vi.hoisted(() => ({ create: vi.fn(), smtp: vi.fn() }))
vi.mock("mailgun.js", () => ({
	default: class {
		client() {
			return { messages: { create } }
		}
	},
}))
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: smtp }) } }))
afterEach(() => {
	vi.unstubAllEnvs()
	vi.resetModules()
	vi.clearAllMocks()
})
describe("email delivery", () => {
	it("sends OTP text and HTML through the configured Mailgun domain", async () => {
		vi.stubEnv("MAILGUN_API_KEY", "test-key")
		vi.stubEnv("MAILGUN_DOMAIN", "mail.example.com")
		const { sendSignInOtpEmail } = await import("../email")
		await sendSignInOtpEmail("invited@example.com", "123456")
		expect(create).toHaveBeenCalledWith(
			"mail.example.com",
			expect.objectContaining({
				to: "invited@example.com",
				text: expect.stringContaining("123456"),
				html: expect.stringContaining("123456"),
			}),
		)
		expect(smtp).not.toHaveBeenCalled()
	})
	it("propagates delivery failures to avoid reporting success", async () => {
		vi.stubEnv("MAILGUN_API_KEY", "test-key")
		vi.stubEnv("MAILGUN_DOMAIN", "mail.example.com")
		const failure = new Error("delivery failed")
		create.mockRejectedValueOnce(failure)
		const { sendSignInOtpEmail } = await import("../email")
		await expect(sendSignInOtpEmail("invited@example.com", "123456")).rejects.toBe(failure)
	})
	it("uses SMTP when Mailgun is not configured", async () => {
		vi.stubEnv("MAILGUN_API_KEY", "")
		vi.stubEnv("MAILGUN_DOMAIN", "")
		const { sendInvitationEmail } = await import("../email")
		await sendInvitationEmail("invited@example.com", "test-token")
		expect(smtp).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "invited@example.com",
				text: expect.stringContaining("test-token"),
			}),
		)
		expect(create).not.toHaveBeenCalled()
	})
})
