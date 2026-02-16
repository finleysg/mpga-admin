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

	if (isPending) {
		return (
			<div className="bg-muted flex min-h-svh items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	if (session) {
		return (
			<div className="bg-muted flex min-h-svh items-center justify-center">
				<div className="text-muted-foreground">Redirecting...</div>
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
						<CardTitle className="font-heading text-xl">Welcome back</CardTitle>
						<CardDescription>Sign in to your admin account</CardDescription>
					</CardHeader>
					<CardContent>
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
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
