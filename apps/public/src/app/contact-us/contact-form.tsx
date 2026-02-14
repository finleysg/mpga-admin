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
	FieldLabel,
	Input,
	Textarea,
} from "@mpga/ui"
import { useState } from "react"

import { submitContactForm } from "./actions"

export function ContactForm() {
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
		setError("")
		setLoading(true)

		try {
			const result = await submitContactForm({
				contactName,
				contactEmail,
				contactPhone,
				course,
				message,
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
					<div className="grid gap-4">
						{error && <FieldError>{error}</FieldError>}
						<Field>
							<FieldLabel htmlFor="contactName">Name</FieldLabel>
							<Input
								id="contactName"
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
								placeholder="Your message..."
								rows={5}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								required
							/>
						</Field>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Sending..." : "Send Message"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
