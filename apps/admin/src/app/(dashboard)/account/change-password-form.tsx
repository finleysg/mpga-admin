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
import { CircleCheck } from "lucide-react"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password-rules"

export function ChangePasswordForm() {
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [changed, setChanged] = useState(false)

	// Editing the form again clears the previous outcome.
	const edit = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setter(e.target.value)
		setChanged(false)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setChanged(false)
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
				setChanged(true)
				toast.success("Password changed")
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
						{changed && (
							<div
								role="status"
								className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
							>
								<CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
								<p>
									<span className="font-semibold">Your password has been changed.</span> Use it the
									next time you sign in. You&apos;ve been signed out on your other devices.
								</p>
							</div>
						)}
						<Field>
							<FieldLabel htmlFor="current-password">Current password</FieldLabel>
							<Input
								id="current-password"
								type="password"
								autoComplete="current-password"
								value={currentPassword}
								onChange={edit(setCurrentPassword)}
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
								onChange={edit(setNewPassword)}
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
								onChange={edit(setConfirm)}
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
