"use client"

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
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

import {
	type GolfCourseOption,
	saveTournamentInstanceAction,
	type TournamentInstanceData,
} from "./actions"

interface InstanceFormProps {
	instance: TournamentInstanceData
	courses: GolfCourseOption[]
}

function toDatetimeLocal(value: string | null): string {
	if (!value) return ""
	// Server returns "YYYY-MM-DD HH:MM:SS.ssssss" — convert to "YYYY-MM-DDTHH:MM"
	return value.replace(" ", "T").slice(0, 16)
}

function fromDatetimeLocal(value: string): string | null {
	if (!value) return null
	// Input gives "YYYY-MM-DDTHH:MM" — convert to "YYYY-MM-DD HH:MM:SS.000000"
	return value.replace("T", " ") + ":00.000000"
}

export function InstanceForm({ instance, courses }: InstanceFormProps) {
	const [mounted, setMounted] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => setMounted(true), [])

	const [name, setName] = useState(instance.name)
	const [startDate, setStartDate] = useState(instance.startDate)
	const [rounds, setRounds] = useState(instance.rounds)
	const [registrationStart, setRegistrationStart] = useState(
		toDatetimeLocal(instance.registrationStart),
	)
	const [registrationEnd, setRegistrationEnd] = useState(toDatetimeLocal(instance.registrationEnd))
	const [locationId, setLocationId] = useState(instance.locationId)

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			setError("Name is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveTournamentInstanceAction({
				id: instance.id,
				name: name.trim(),
				startDate,
				rounds,
				registrationStart: fromDatetimeLocal(registrationStart),
				registrationEnd: fromDatetimeLocal(registrationEnd),
				locationId,
			})

			if (result.success) {
				toast.success("Tournament instance updated")
			} else {
				setError(result.error ?? "Failed to save")
			}
		} catch {
			setError("Failed to save tournament instance")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading">Tournament Details</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave} className="space-y-4">
					<Field>
						<FieldLabel htmlFor="name">Name</FieldLabel>
						<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
					</Field>

					<Field>
						<FieldLabel htmlFor="startDate">Start Date</FieldLabel>
						<Input
							id="startDate"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							required
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="rounds">Rounds</FieldLabel>
						<Input
							id="rounds"
							type="number"
							min={1}
							value={rounds}
							onChange={(e) => setRounds(parseInt(e.target.value, 10) || 1)}
							required
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="registrationStart">Registration Start</FieldLabel>
						<Input
							id="registrationStart"
							type="datetime-local"
							value={registrationStart}
							onChange={(e) => setRegistrationStart(e.target.value)}
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="registrationEnd">Registration End</FieldLabel>
						<Input
							id="registrationEnd"
							type="datetime-local"
							value={registrationEnd}
							onChange={(e) => setRegistrationEnd(e.target.value)}
						/>
					</Field>

					<Field>
						<FieldLabel>Location</FieldLabel>
						{mounted ? (
							<Select
								value={String(locationId)}
								onValueChange={(value) => setLocationId(parseInt(value, 10))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{courses.map((course) => (
										<SelectItem key={course.id} value={String(course.id)}>
											{course.name} - {course.city}, {course.state}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<div className="h-9 rounded-md border bg-transparent" />
						)}
					</Field>

					{error && <FieldError>{error}</FieldError>}

					<div className="flex justify-end pt-4">
						<Button type="submit" variant="secondary" disabled={saving}>
							{saving ? "Saving..." : "Save"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
