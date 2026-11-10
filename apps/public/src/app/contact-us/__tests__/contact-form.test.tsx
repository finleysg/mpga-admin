import "@testing-library/jest-dom/vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const { submit, tokenCallback, mounts } = vi.hoisted(() => ({
	submit: vi.fn(),
	tokenCallback: { current: (_token: string) => {} },
	mounts: { attempts: [] as number[] },
}))
vi.mock("../actions", () => ({ submitContactForm: submit }))
vi.mock("../turnstile", () => ({
	Turnstile: ({ onToken, attempt }: { onToken: (token: string) => void; attempt: number }) => {
		tokenCallback.current = onToken
		mounts.attempts.push(attempt)
		return <div>Verification widget</div>
	},
}))
import { ContactForm } from "../contact-form"
beforeEach(() => {
	mounts.attempts = []
	submit.mockReset()
})
afterEach(cleanup)
function fill() {
	fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Visitor" } })
	fireEvent.change(screen.getByLabelText("Email"), { target: { value: "visitor@example.com" } })
	fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello" } })
}
it("disables sending until verification completes and again when it expires", () => {
	render(<ContactForm siteKey="test-key" />)
	expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled()
	act(() => tokenCallback.current("token"))
	expect(screen.getByRole("button", { name: "Send Message" })).toBeEnabled()
	act(() => tokenCallback.current(""))
	expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled()
})
it("retains the message and requests fresh verification after rejection", async () => {
	submit.mockResolvedValue({ success: false, error: "Too many messages" })
	render(<ContactForm siteKey="test-key" />)
	fill()
	act(() => tokenCallback.current("token"))
	fireEvent.click(screen.getByRole("button", { name: "Send Message" }))
	await screen.findByText("Too many messages")
	expect(screen.getByLabelText("Message")).toHaveValue("Hello")
	expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled()
	expect(mounts.attempts).toContain(1)
	expect(submit).toHaveBeenCalledWith(
		expect.objectContaining({ turnstileToken: "token", website: "" }),
	)
})
it("shows thanks after a successful submission", async () => {
	submit.mockResolvedValue({ success: true })
	render(<ContactForm siteKey="test-key" />)
	fill()
	act(() => tokenCallback.current("token"))
	fireEvent.click(screen.getByRole("button", { name: "Send Message" }))
	await waitFor(() => expect(screen.getByText("Thank You!")).toBeInTheDocument())
})
it("fails closed with a useful message when the site key is missing", () => {
	render(<ContactForm siteKey="" />)
	expect(screen.getByRole("alert")).toHaveTextContent("temporarily unavailable")
	expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled()
})
