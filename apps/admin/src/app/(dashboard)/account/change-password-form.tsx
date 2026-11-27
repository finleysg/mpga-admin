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
	toast,
} from "@mpga/ui"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password-rules"

export function ChangePasswordForm() {
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const problem = passwordProblem(newPassword, confirm)
		if (problem) {
			setError(problem)
			return
		}
		if (newPassword === currentPassword) {
			setError("Choose a password different from your current one.")
			return
		}

		setError("")
		setLoading(true)
		try {
			const result = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			})
			if (result.error) {
				setError(
					result.error.code === "INVALID_PASSWORD"
						? "Current password is incorrect."
						: (result.error.message ?? "Couldn't change your password. Please try again."),
				)
			} else {
				setCurrentPassword("")
				setNewPassword("")
				setConfirm("")
				toast.success("Password changed. You've been signed out on other devices.")
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading text-xl">Change password</CardTitle>
				<CardDescription>
					Use {MIN_PASSWORD_LENGTH} to {MAX_PASSWORD_LENGTH} characters. Changing it signs you out
					on your other devices.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-6">
						{error && <FieldError role="alert">{error}</FieldError>}
						<Field>
							<FieldLabel htmlFor="current-password">Current password</FieldLabel>
							<Input
								id="current-password"
								type="password"
								autoComplete="current-password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="new-password">New password</FieldLabel>
							<Input
								id="new-password"
								type="password"
								autoComplete="new-password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
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
						<div>
							<Button type="submit" disabled={loading}>
								{loading ? "Saving..." : "Change password"}
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
