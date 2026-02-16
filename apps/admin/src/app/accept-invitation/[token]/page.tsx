"use client"

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldLabel,
	Input,
} from "@mpga/ui"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { signIn } from "@/lib/auth-client"
import { signUpWithInvitation } from "../actions"

interface InvitationData {
	email: string
	role: string
}

interface AcceptInvitationPageProps {
	params: Promise<{ token: string }>
}

export default function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
	const router = useRouter()
	const [token, setToken] = useState<string | null>(null)
	const [invitation, setInvitation] = useState<InvitationData | null>(null)
	const [isValidating, setIsValidating] = useState(true)
	const [validationError, setValidationError] = useState<string | null>(null)

	const [name, setName] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		async function validateToken() {
			const { token: tokenParam } = await params
			setToken(tokenParam)

			try {
				const response = await fetch(
					`/api/invitations/validate?token=${encodeURIComponent(tokenParam)}`,
				)
				const data = await response.json()

				if (!response.ok || !data.valid) {
					setValidationError(data.error || "This invitation link is invalid or has expired.")
				} else {
					setInvitation({ email: data.email, role: data.role })
				}
			} catch {
				setValidationError("Failed to validate invitation. Please try again.")
			} finally {
				setIsValidating(false)
			}
		}

		validateToken()
	}, [params])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!invitation || !token) return

		setError("")
		setLoading(true)

		try {
			const result = await signUpWithInvitation(token, name, password)

			if (!result.success) {
				setError(result.error ?? "Account creation failed")
				return
			}

			const signInResult = await signIn.email({
				email: invitation.email,
				password,
			})

			if (signInResult.error) {
				setError("Account created but sign-in failed. Please log in manually.")
				router.push("/login")
				return
			}

			router.push("/")
			router.refresh()
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	if (isValidating) {
		return (
			<div className="bg-muted flex min-h-svh items-center justify-center">
				<div className="text-muted-foreground">Validating invitation...</div>
			</div>
		)
	}

	if (validationError) {
		return (
			<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
				<a href="/" className="relative h-16 w-42 self-center">
					<Image
						src="/images/mpga-logo.png"
						alt="MPGA"
						fill={true}
						className="object-contain"
						priority
					/>
				</a>
				<div className="w-full max-w-sm">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="font-heading text-xl">Invalid Invitation</CardTitle>
							<CardDescription>{validationError}</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-center text-sm">
								Please contact an administrator to request a new invitation.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<a href="/" className="relative h-16 w-42 self-center">
				<Image
					src="/images/mpga-logo.png"
					alt="MPGA"
					fill={true}
					className="object-contain"
					priority
				/>
			</a>
			<div className="w-full max-w-sm">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="font-heading text-xl">Create your account</CardTitle>
						<CardDescription>
							You&apos;ve been invited to join as an {invitation?.role}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit}>
							<div className="grid gap-6">
								{error && (
									<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
										{error}
									</div>
								)}
								<Field>
									<FieldLabel htmlFor="name">Name</FieldLabel>
									<Input
										id="name"
										type="text"
										placeholder="Your name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<Input
										id="email"
										type="email"
										value={invitation?.email ?? ""}
										readOnly
										className="bg-muted"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="password">Password</FieldLabel>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
									/>
								</Field>
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? "Creating account..." : "Create account"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
