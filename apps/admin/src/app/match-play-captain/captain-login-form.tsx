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
import { useState } from "react"

import { sendCaptainOtp, verifyCaptainOtp } from "./actions"

export function CaptainLoginForm() {
	const router = useRouter()
	const [email, setEmail] = useState("")
	const [otp, setOtp] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [step, setStep] = useState<"email" | "otp">("email")

	const handleSendOtp = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setLoading(true)
		try {
			const result = await sendCaptainOtp(email)
			if (result.error) {
				setError(result.error)
			} else {
				setStep("otp")
				setOtp("")
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	const handleVerifyOtp = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setLoading(true)
		try {
			const result = await verifyCaptainOtp(email, otp.trim())
			if (result.error) {
				setError(result.error)
			} else {
				router.refresh()
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
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
						<CardTitle className="font-heading text-xl">Captain Sign In</CardTitle>
						<CardDescription>
							{step === "email"
								? "Enter your email to verify your identity as a match play captain."
								: `We sent a 6-digit code to ${email}. Enter it below to continue.`}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{step === "email" ? (
							<form onSubmit={handleSendOtp}>
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
										{loading ? "Sending..." : "Send sign-in code"}
									</Button>
								</div>
							</form>
						) : (
							<form onSubmit={handleVerifyOtp}>
								<div className="grid gap-6">
									{error && <FieldError>{error}</FieldError>}
									<Field>
										<FieldLabel htmlFor="otp">Sign-in code</FieldLabel>
										<Input
											id="otp"
											type="text"
											inputMode="numeric"
											autoComplete="one-time-code"
											pattern="[0-9]*"
											maxLength={6}
											placeholder="123456"
											value={otp}
											onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
											required
											autoFocus
										/>
									</Field>
									<Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
										{loading ? "Verifying..." : "Verify and continue"}
									</Button>
									<button
										type="button"
										className="text-muted-foreground text-sm underline"
										onClick={() => {
											setStep("email")
											setError("")
											setOtp("")
										}}
										disabled={loading}
									>
										Use a different email or resend a code
									</button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
