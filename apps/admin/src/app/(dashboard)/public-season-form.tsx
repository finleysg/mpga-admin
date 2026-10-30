"use client"

import { Button, toast } from "@mpga/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { setPublicTournamentSeasonAction } from "./season-actions"

export function PublicSeasonForm({ year, years }: { year: number; years: number[] }) {
	const [selected, setSelected] = useState(String(year))
	const [pending, setPending] = useState(false)
	const router = useRouter()
	return (
		<form
			className="space-y-3"
			onSubmit={async (event) => {
				event.preventDefault()
				setPending(true)
				try {
					const result = await setPublicTournamentSeasonAction(Number(selected))
					if (!result.success) {
						toast.error(result.error ?? "Unable to update public season")
						return
					}
					toast.success(`Public tournament schedule now shows ${selected}`)
					router.refresh()
				} catch {
					toast.error("Unable to update public season")
				} finally {
					setPending(false)
				}
			}}
		>
			<label htmlFor="public-season" className="block font-semibold">
				Public tournament season
			</label>
			<p>
				The tournaments page currently shows {year}. Copying a season does not change this setting.
			</p>
			<div className="flex items-center gap-3">
				<select
					id="public-season"
					className="rounded-md border p-2"
					value={selected}
					onChange={(event) => setSelected(event.target.value)}
					disabled={pending}
				>
					{[...new Set([year, ...years])]
						.sort((a, b) => b - a)
						.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
				</select>
				<Button variant="secondary" disabled={pending || !years.includes(Number(selected))}>
					{pending ? "Saving…" : "Set public season"}
				</Button>
			</div>
		</form>
	)
}
