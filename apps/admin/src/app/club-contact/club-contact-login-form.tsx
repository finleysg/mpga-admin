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
} from "@mpga/ui"
import { useState } from "react"

import { sendClubContactVerification } from "./actions"

interface ClubContactLoginFormProps {
	clubId: number
	callbackPath: string
}

export function ClubContactLoginForm({ clubId, callbackPath }: ClubContactLoginFormProps) {
	const [email, setEmail] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setLoading(true)

		try {
			const result = await sendClubContactVerification(clubId, email, callbackPath)
			if (result.error) {
				setError(result.error)
			} else {
				setSent(true)
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<a href="/" className="flex items-center gap-2 self-center font-medium">
				<div className="bg-secondary text-secondary-foreground flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold">
					M
				</div>
				<span className="font-heading text-xl">MPGA</span>
			</a>
			<div className="w-full max-w-sm">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="font-heading text-xl">Club Contact Verification</CardTitle>
						<CardDescription>
							Enter your email to verify your identity as a club contact.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{sent ? (
							<div className="text-center">
								<p className="text-sm font-medium">Check your email</p>
								<p className="text-muted-foreground mt-2 text-sm">
									We sent a verification link to <strong>{email}</strong>. Click the link to
									continue.
								</p>
							</div>
						) : (
							<form onSubmit={handleSubmit}>
								<div className="grid gap-6">
									{error && <FieldError>{error}</FieldError>}
									<Field>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="your@email.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
										/>
									</Field>
									<Button type="submit" className="w-full" disabled={loading}>
										{loading ? "Sending..." : "Send verification link"}
									</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
