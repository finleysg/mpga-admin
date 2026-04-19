"use client"

import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldError,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@mpga/ui"
import { useEffect, useState } from "react"

import { getCaptainResult, saveCaptainResult } from "../actions"
import type { CaptainResult, CaptainTeam, OpponentOption } from "../types"

interface ResultFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	team: CaptainTeam
	opponents: OpponentOption[]
	editing: CaptainResult | null
	onSaved: (result: CaptainResult) => void
}

function todayIso(): string {
	return new Date().toISOString().slice(0, 10)
}

export function ResultFormDialog({
	open,
	onOpenChange,
	team,
	opponents,
	editing,
	onSaved,
}: ResultFormDialogProps) {
	const [opponentId, setOpponentId] = useState<number | null>(null)
	const [weAreHome, setWeAreHome] = useState(true)
	const [matchDate, setMatchDate] = useState(todayIso())
	const [ourScore, setOurScore] = useState("0.0")
	const [opponentScore, setOpponentScore] = useState("0.0")
	const [forfeit, setForfeit] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!open) return
		setError(null)
		if (editing) {
			const isHome = editing.homeTeamId === team.id
			setWeAreHome(isHome)
			setOpponentId(isHome ? editing.awayTeamId : editing.homeTeamId)
			setMatchDate(editing.matchDate)
			setOurScore(isHome ? editing.homeTeamScore : editing.awayTeamScore)
			setOpponentScore(isHome ? editing.awayTeamScore : editing.homeTeamScore)
			setForfeit(editing.forfeit)
		} else {
			setOpponentId(null)
			setWeAreHome(true)
			setMatchDate(todayIso())
			setOurScore("0.0")
			setOpponentScore("0.0")
			setForfeit(false)
		}
	}, [open, editing, team.id])

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!opponentId) {
			setError("Please select an opponent")
			return
		}
		if (!matchDate) {
			setError("Match date is required")
			return
		}

		setSaving(true)
		try {
			const saveRes = await saveCaptainResult({
				id: editing?.id,
				captainTeamId: team.id,
				opponentTeamId: opponentId,
				weAreHome,
				matchDate,
				ourScore: ourScore.trim() || "0.0",
				opponentScore: opponentScore.trim() || "0.0",
				forfeit,
			})

			if (!saveRes.success || !saveRes.data) {
				setError(saveRes.error ?? "Failed to save result")
				return
			}

			const fetched = await getCaptainResult(team.id, saveRes.data.id)
			if (!fetched.success || !fetched.data) {
				setError(fetched.error ?? "Saved, but failed to refresh")
				return
			}

			toast.success(editing ? "Result updated" : "Result saved")
			onSaved(fetched.data)
		} catch (err) {
			console.error("Failed to save result:", err)
			setError("Failed to save result")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-heading text-secondary-500">
						{editing ? "Edit Result" : "Enter Match Result"}
					</DialogTitle>
					<DialogDescription>
						{team.clubName} &mdash; {team.groupName}
						{team.isSenior ? " (Senior)" : ""}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSave} className="space-y-4">
					<Field>
						<FieldLabel>
							Opponent <span className="text-destructive">*</span>
						</FieldLabel>
						<Select
							value={opponentId !== null ? String(opponentId) : ""}
							onValueChange={(v) => setOpponentId(v ? parseInt(v, 10) : null)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select an opponent" />
							</SelectTrigger>
							<SelectContent>
								{opponents.map((o) => (
									<SelectItem key={o.id} value={String(o.id)}>
										{o.clubName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					<Field>
						<FieldLabel>
							Where was the match played? <span className="text-destructive">*</span>
						</FieldLabel>
						<div className="flex gap-4 text-sm">
							<label className="flex items-center gap-2">
								<input
									type="radio"
									name="home"
									checked={weAreHome}
									onChange={() => setWeAreHome(true)}
								/>
								We hosted
							</label>
							<label className="flex items-center gap-2">
								<input
									type="radio"
									name="home"
									checked={!weAreHome}
									onChange={() => setWeAreHome(false)}
								/>
								We were away
							</label>
						</div>
					</Field>

					<Field>
						<FieldLabel htmlFor="matchDate">
							Match date <span className="text-destructive">*</span>
						</FieldLabel>
						<Input
							id="matchDate"
							type="date"
							max={todayIso()}
							value={matchDate}
							onChange={(e) => setMatchDate(e.target.value)}
							required
						/>
					</Field>

					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="ourScore">Our score</FieldLabel>
							<Input
								id="ourScore"
								inputMode="decimal"
								value={ourScore}
								onChange={(e) => setOurScore(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="opponentScore">Opponent score</FieldLabel>
							<Input
								id="opponentScore"
								inputMode="decimal"
								value={opponentScore}
								onChange={(e) => setOpponentScore(e.target.value)}
							/>
						</Field>
					</div>

					<Field orientation="horizontal">
						<Checkbox
							id="forfeit"
							checked={forfeit}
							onCheckedChange={(checked) => setForfeit(checked === true)}
						/>
						<FieldLabel htmlFor="forfeit" className="mb-0">
							Forfeit
						</FieldLabel>
					</Field>

					{error && <FieldError>{error}</FieldError>}

					<DialogFooter>
						<Button
							type="button"
							variant="secondaryoutline"
							onClick={() => onOpenChange(false)}
							disabled={saving}
						>
							Cancel
						</Button>
						<Button type="submit" variant="secondary" disabled={saving}>
							{saving ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
