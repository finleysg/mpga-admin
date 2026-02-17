"use client"

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Combobox,
	Field,
	FieldError,
	FieldLabel,
	Input,
	Textarea,
	toast,
} from "@mpga/ui"
import { useState } from "react"

import { saveClubForContact } from "../../actions"
import type { ClubContactClubData, GolfCourseOption } from "../../types"

interface ClubEditFormProps {
	club: ClubContactClubData
	golfCourses: GolfCourseOption[]
}

export function ClubEditForm({ club, golfCourses }: ClubEditFormProps) {
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [name, setName] = useState(club.name)
	const [website, setWebsite] = useState(club.website)
	const [golfCourseId, setGolfCourseId] = useState<number | null>(club.golfCourseId)
	const [size, setSize] = useState<string>(club.size?.toString() ?? "")
	const [notes, setNotes] = useState(club.notes ?? "")

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			setError("Name is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveClubForContact({
				id: club.id,
				name: name.trim(),
				website: website.trim(),
				golfCourseId,
				size: size ? (Number.isNaN(parseInt(size, 10)) ? null : parseInt(size, 10)) : null,
				notes: notes.trim() || null,
			})

			if (result.success) {
				toast.success("Club updated")
			} else {
				setError(result.error ?? "Failed to save club")
			}
		} catch (err) {
			console.error("Failed to save club:", err)
			setError("Failed to save club")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading text-xl">Club Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave}>
					<div className="space-y-4">
						<Field>
							<FieldLabel htmlFor="name">
								Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
						</Field>

						<Field>
							<FieldLabel htmlFor="website">Website</FieldLabel>
							<Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
						</Field>

						<Field>
							<FieldLabel>Golf Course</FieldLabel>
							<Combobox
								options={[
									{ value: "none", label: "None" },
									...golfCourses.map((course) => ({
										value: String(course.id),
										label: course.name,
									})),
								]}
								value={golfCourseId !== null ? String(golfCourseId) : "none"}
								onValueChange={(value) =>
									setGolfCourseId(value === "none" ? null : parseInt(value, 10))
								}
								placeholder="Select course"
								searchPlaceholder="Search courses..."
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="size">Size</FieldLabel>
							<Input
								id="size"
								type="number"
								value={size}
								onChange={(e) => setSize(e.target.value)}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="notes">Notes</FieldLabel>
							<Textarea
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={4}
							/>
						</Field>
					</div>

					{error && <FieldError className="mt-4">{error}</FieldError>}

					<Button type="submit" variant="secondary" className="mt-6 w-full" disabled={saving}>
						{saving ? "Saving..." : "Save"}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
