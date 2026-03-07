"use client"

import { useState } from "react"

import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog"
import { Field, FieldError, FieldLabel } from "./ui/field"
import { H3 } from "./ui/heading"
import { Input } from "./ui/input"

export interface MatchPlayTeamRow {
	id: number
	clubName: string
	groupName: string
	isSenior: boolean
}

export interface MatchPlayGroupCardsProps {
	teams: MatchPlayTeamRow[]
	year: number
	onRequestCaptains?: (
		groupName: string,
		email: string,
	) => Promise<{ success: boolean; error?: string }>
}

export function MatchPlayGroupCards({ teams, year, onRequestCaptains }: MatchPlayGroupCardsProps) {
	const [dialogOpen, setDialogOpen] = useState(false)
	const [selectedGroup, setSelectedGroup] = useState("")
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [sent, setSent] = useState(false)

	if (teams.length === 0) {
		return <p className="text-gray-600">No teams have been assigned for {year} yet.</p>
	}

	const groups = new Map<string, MatchPlayTeamRow[]>()
	for (const team of teams) {
		const existing = groups.get(team.groupName) ?? []
		existing.push(team)
		groups.set(team.groupName, existing)
	}

	function openDialog(groupName: string) {
		setSelectedGroup(groupName)
		setEmail("")
		setError("")
		setSent(false)
		setDialogOpen(true)
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!onRequestCaptains) return

		setError("")
		setLoading(true)
		try {
			const result = await onRequestCaptains(selectedGroup, email)
			if (result.success) {
				setSent(true)
			} else {
				setError(result.error ?? "Failed to request captain contacts")
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from(groups.entries()).map(([groupName, groupTeams]) => {
					const isSenior = groupTeams[0]?.isSenior
					return (
						<Card key={groupName}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<H3 className="text-lg font-bold text-primary-900">{groupName}</H3>
									{isSenior && (
										<span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
											Senior
										</span>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<ul className="mb-4 space-y-1.5">
									{groupTeams.map((team) => (
										<li
											key={team.id}
											className="text-sm text-gray-700 before:mr-2 before:text-primary-300 before:content-['•']"
										>
											{team.clubName}
										</li>
									))}
								</ul>
								{onRequestCaptains && (
									<Button variant="outline" size="sm" onClick={() => openDialog(groupName)}>
										Captains
									</Button>
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="font-heading">Request Captain Contacts</DialogTitle>
						<DialogDescription>
							Enter your email to receive captain contact information for{" "}
							<strong>{selectedGroup}</strong>. You must be a registered club contact and team
							captain in this group.
						</DialogDescription>
					</DialogHeader>
					{sent ? (
						<div className="py-4 text-center">
							<p className="text-sm text-green-700">
								Check your email for the captain contact information.
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit}>
							<div className="grid gap-4">
								{error && <FieldError>{error}</FieldError>}
								<Field>
									<FieldLabel htmlFor="captain-email">Email</FieldLabel>
									<Input
										id="captain-email"
										type="email"
										placeholder="your@email.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</Field>
								<DialogFooter>
									<Button type="submit" disabled={loading}>
										{loading ? "Sending..." : "Send Contacts"}
									</Button>
								</DialogFooter>
							</div>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}
