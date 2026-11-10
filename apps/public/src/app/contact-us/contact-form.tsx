"use client"

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Textarea,
} from "@mpga/ui"
import { useState } from "react"

import { submitContactForm } from "./actions"
import { Turnstile } from "./turnstile"

export function ContactForm({ siteKey }: { siteKey: string }) {
	const [website, setWebsite] = useState("")
	const [turnstileToken, setTurnstileToken] = useState("")
	const [attempt, setAttempt] = useState(0)
	const [contactName, setContactName] = useState("")
	const [contactEmail, setContactEmail] = useState("")
	const [contactPhone, setContactPhone] = useState("")
	const [course, setCourse] = useState("")
	const [message, setMessage] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (loading || !turnstileToken || !siteKey) return
		setError("")
		setLoading(true)

		try {
			const result = await submitContactForm({
				contactName,
				contactEmail,
				contactPhone,
				course,
				message,
				website,
				turnstileToken,
			})
			if (result.success) {
				setSent(true)
			} else {
				setError(result.error ?? "Failed to send message")
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
			setTurnstileToken("")
			setAttempt((value) => value + 1)
		}
	}

	if (sent) {
		return (
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="font-heading text-xl">Thank You!</CardTitle>
					<CardDescription>
						Your message has been sent. We will get back to you as soon as possible.
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading text-xl">Send Us a Message</CardTitle>
				<CardDescription>
					Fill out the form below and we will get back to you as soon as possible.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup className="gap-4">
						{error && <FieldError role="alert">{error}</FieldError>}
						{!siteKey && (
							<FieldError role="alert">
								The contact form is temporarily unavailable. Please try again later.
							</FieldError>
						)}
						<div hidden aria-hidden="true">
							<label htmlFor="website">Leave this field empty</label>
							<input
								id="website"
								name="website"
								tabIndex={-1}
								autoComplete="off"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
							/>
						</div>
						<Field>
							<FieldLabel htmlFor="contactName">Name</FieldLabel>
							<Input
								id="contactName"
								maxLength={100}
								type="text"
								placeholder="Your name"
								value={contactName}
								onChange={(e) => setContactName(e.target.value)}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="contactEmail">Email</FieldLabel>
							<Input
								id="contactEmail"
								maxLength={254}
								type="email"
								placeholder="your@email.com"
								value={contactEmail}
								onChange={(e) => setContactEmail(e.target.value)}
								required
							/>
						</Field>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="contactPhone">Phone</FieldLabel>
								<Input
									id="contactPhone"
									maxLength={20}
									type="tel"
									placeholder="(555) 555-5555"
									value={contactPhone}
									onChange={(e) => setContactPhone(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="course">Home Course</FieldLabel>
								<Input
									id="course"
									maxLength={100}
									type="text"
									placeholder="Course name"
									value={course}
									onChange={(e) => setCourse(e.target.value)}
								/>
							</Field>
						</div>
						<Field>
							<FieldLabel htmlFor="message">Message</FieldLabel>
							<Textarea
								id="message"
								maxLength={5000}
								placeholder="Your message..."
								rows={5}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								required
							/>
						</Field>
						{siteKey && (
							<Turnstile siteKey={siteKey} attempt={attempt} onToken={setTurnstileToken} />
						)}
						<Button
							type="submit"
							className="w-full"
							disabled={loading || !turnstileToken || !siteKey}
						>
							{loading ? "Sending..." : "Send Message"}
						</Button>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	)
}
