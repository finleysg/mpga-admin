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
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setLoading(true)
		try {
			const result = await authClient.requestPasswordReset({ email: email.trim() })
			if (result.error) {
				setError(
					result.error.status === 429
						? "Too many requests. Please wait a minute and try again."
						: "Couldn't send the reset email. Please try again.",
				)
			} else {
				// Same message whether or not the address has an account, so it can't be probed.
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
			<Link href="/login" className="relative h-16 w-42 self-center">
				<Image
					src="/images/mpga-logo.png"
					alt="MPGA"
					fill={true}
					className="object-contain"
					priority
				/>
			</Link>
			<div className="w-full max-w-sm">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="font-heading text-xl">
							{sent ? "Check your email" : "Forgot your password?"}
						</CardTitle>
						<CardDescription>
							{sent
								? `If ${email.trim()} belongs to an MPGA Admin account, we've sent it a link to choose a new password. The link expires in 24 hours.`
								: "Enter your email and we'll send you a link to choose a new password."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{sent ? (
							<Button asChild variant="outline" className="w-full">
								<Link href="/login">Back to sign in</Link>
							</Button>
						) : (
							<form onSubmit={handleSubmit}>
								<div className="grid gap-6">
									{error && <FieldError role="alert">{error}</FieldError>}
									<Field>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											autoComplete="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
										/>
									</Field>
									<Button type="submit" className="w-full" disabled={loading}>
										{loading ? "Sending..." : "Send reset link"}
									</Button>
									<Link
										href="/login"
										className="text-muted-foreground hover:text-foreground text-center text-sm"
									>
										Back to sign in
									</Link>
								</div>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
