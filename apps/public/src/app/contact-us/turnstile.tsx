"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"

interface TurnstileApi {
	render: (
		container: HTMLElement,
		options: {
			sitekey: string
			action: string
			size: string
			callback: (token: string) => void
			"expired-callback": () => void
			"error-callback": () => void
		},
	) => string
	remove: (id: string) => void
}

declare global {
	interface Window {
		turnstile?: TurnstileApi
	}
}

export function Turnstile({
	siteKey,
	attempt,
	onToken,
}: {
	siteKey: string
	attempt: number
	onToken: (token: string) => void
}) {
	const container = useRef<HTMLDivElement>(null)
	const [ready, setReady] = useState(false)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		if (!ready || !container.current || !window.turnstile) return
		const api = window.turnstile
		const id = api.render(container.current, {
			sitekey: siteKey,
			action: "contact",
			size: "flexible",
			callback: (token) => {
				setFailed(false)
				onToken(token)
			},
			"expired-callback": () => onToken(""),
			"error-callback": () => {
				onToken("")
				setFailed(true)
			},
		})
		return () => {
			api.remove(id)
		}
	}, [ready, siteKey, attempt, onToken])

	return (
		<>
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
				onReady={() => setReady(true)}
				onError={() => {
					onToken("")
					setFailed(true)
				}}
			/>
			<div ref={container} />
			{failed && (
				<p role="alert" className="text-destructive text-sm">
					Verification could not load. Please refresh the page and try again.
				</p>
			)}
		</>
	)
}
