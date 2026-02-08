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
	FieldSeparator,
	Input,
} from "@mpga/ui"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { signIn, useSession } from "@/lib/auth-client"

export default function LoginPage() {
	const router = useRouter()
	const { data: session, isPending } = useSession()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!isPending && session) {
			router.push("/")
		}
	}, [session, isPending, router])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setLoading(true)

		try {
			const result = await signIn.email({
				email,
				password,
			})

			if (result.error) {
				setError(result.error.message ?? "Login failed")
			} else {
				router.push("/")
				router.refresh()
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	const handleGoogleSignIn = async () => {
		await signIn.social({ provider: "google", callbackURL: "/" })
	}

	if (isPending) {
		return (
			<div className="bg-muted flex min-h-svh items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	if (session) {
		return null
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
						<CardTitle className="font-heading text-xl">Welcome back</CardTitle>
						<CardDescription>Sign in to your admin account</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-6">
							<div className="flex flex-col gap-4">
								<Button
									variant="outline"
									className="w-full"
									type="button"
									onClick={handleGoogleSignIn}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										className="mr-2 h-5 w-5"
									>
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
											fill="currentColor"
										/>
									</svg>
									Sign in with Google
								</Button>
							</div>
							<FieldSeparator>Or continue with</FieldSeparator>
							<form onSubmit={handleSubmit}>
								<div className="grid gap-6">
									{error && <FieldError>{error}</FieldError>}
									<Field>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="admin@example.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
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
										{loading ? "Signing in..." : "Sign in"}
									</Button>
								</div>
							</form>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
