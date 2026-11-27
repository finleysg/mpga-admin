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
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password-rules"

const INVALID_LINK = "This link is invalid or has expired. You can request a new one."

export function ResetPasswordForm({ token }: { token: string | null }) {
	const [password, setPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [linkInvalid, setLinkInvalid] = useState(token === null)
	const [done, setDone] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!token) return
		const problem = passwordProblem(password, confirm)
		if (problem) {
			setError(problem)
			return
		}

		setError("")
		setLoading(true)
		try {
			const result = await authClient.resetPassword({ newPassword: password, token })
			if (result.error) {
				if (result.error.code === "INVALID_TOKEN" || result.error.code === "USER_NOT_FOUND") {
					setLinkInvalid(true)
				} else {
					setError(result.error.message ?? "Couldn't update your password. Please try again.")
				}
			} else {
				setDone(true)
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	let title = "Choose a new password"
	let description = `Use ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`
	if (linkInvalid) {
		title = "Link not valid"
		description = INVALID_LINK
	} else if (done) {
		title = "Password updated"
		description = "You can now sign in with your new password."
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
						<CardTitle className="font-heading text-xl">{title}</CardTitle>
						<CardDescription>{description}</CardDescription>
					</CardHeader>
					<CardContent>
						{done ? (
							<Button asChild className="w-full">
								<Link href="/login">Sign in</Link>
							</Button>
						) : linkInvalid ? (
							<div className="grid gap-3">
								<Button asChild className="w-full">
									<Link href="/forgot-password">Request a new link</Link>
								</Button>
								<Button asChild variant="outline" className="w-full">
									<Link href="/login">Back to sign in</Link>
								</Button>
							</div>
						) : (
							<form onSubmit={handleSubmit}>
								<div className="grid gap-6">
									{error && <FieldError role="alert">{error}</FieldError>}
									<Field>
										<FieldLabel htmlFor="new-password">New password</FieldLabel>
										<Input
											id="new-password"
											type="password"
											autoComplete="new-password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
										<Input
											id="confirm-password"
											type="password"
											autoComplete="new-password"
											value={confirm}
											onChange={(e) => setConfirm(e.target.value)}
											required
										/>
									</Field>
									<Button type="submit" className="w-full" disabled={loading}>
										{loading ? "Saving..." : "Set new password"}
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
