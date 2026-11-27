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
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { signIn, signOut, useSession } from "@/lib/auth-client"
import { isLibraryRole } from "@/lib/roles"

export default function LoginPage() {
	const router = useRouter()
	const { data: session, isPending } = useSession()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	// Portal users (club contacts, captains) have a session but no admin access. Don't bounce
	// them back to the dashboard, which would send them here again.
	const hasAdminAccess = isLibraryRole(session?.user?.role)

	useEffect(() => {
		if (!isPending && hasAdminAccess) {
			router.push("/")
		}
	}, [hasAdminAccess, isPending, router])

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
			} else if (
				!isLibraryRole(
					result.data?.user && "role" in result.data.user ? String(result.data.user.role) : null,
				)
			) {
				await signOut()
				setError("This account doesn't have access to the admin site.")
			} else {
				// Full load: router.push + router.refresh loops forever when "/" redirects (board → /library).
				// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- see above
				window.location.assign("/")
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

	if (hasAdminAccess) {
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
								{!error && session && (
									<FieldError>This account doesn&apos;t have access to the admin site.</FieldError>
								)}
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
									<div className="flex items-center justify-between">
										<FieldLabel htmlFor="password">Password</FieldLabel>
										<Link
											href="/forgot-password"
											className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
										>
											Forgot password?
										</Link>
									</div>
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
