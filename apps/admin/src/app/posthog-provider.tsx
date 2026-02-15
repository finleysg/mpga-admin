"use client"

import { PostHogProvider as PHProvider } from "@posthog/react"
import posthog from "posthog-js"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
		if (!key) return

		posthog.init(key, {
			api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
			autocapture: false,
			capture_pageview: false,
			capture_pageleave: false,
			disable_session_recording: true,
		})
	}, [])

	return <PHProvider client={posthog}>{children}</PHProvider>
}
