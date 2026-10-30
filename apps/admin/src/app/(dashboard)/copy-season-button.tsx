"use client"

import { Button, toast } from "@mpga/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { copySeasonAction } from "./season-actions"

export function CopySeasonButton({ year }: { year: number }) {
	const [pending, setPending] = useState(false)
	const [copied, setCopied] = useState(false)
	const router = useRouter()
	if (copied) return null
	return (
		<Button
			variant="secondary"
			disabled={pending}
			onClick={async () => {
				setPending(true)
				try {
					const result = await copySeasonAction()
					if (!result.success) {
						toast.error(result.error ?? "Unable to copy season")
						return
					}
					setCopied(true)
					toast.success(`Created ${result.data?.count} tournaments for ${result.data?.year}`)
					router.refresh()
				} catch {
					toast.error("Unable to copy season. Refresh before trying again.")
				} finally {
					setPending(false)
				}
			}}
		>
			{pending ? "Copying…" : `Copy ${year} tournaments to ${year + 1}`}
		</Button>
	)
}
