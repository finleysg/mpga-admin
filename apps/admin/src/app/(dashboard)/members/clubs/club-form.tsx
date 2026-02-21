"use client"

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Combobox,
	Field,
	FieldError,
	FieldLabel,
	Input,
	toast,
} from "@mpga/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { MarkdownEditor } from "@/components/markdown-editor"

import { type ClubData, type GolfCourseOption, saveClubAction } from "./actions"

interface ClubFormProps {
	club?: ClubData
	golfCourses: GolfCourseOption[]
	onRefresh?: () => void
}

export function ClubForm({ club: existingClub, golfCourses, onRefresh }: ClubFormProps) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [name, setName] = useState(existingClub?.name ?? "")
	const [website, setWebsite] = useState(existingClub?.website ?? "")
	const [golfCourseId, setGolfCourseId] = useState<number | null>(
		existingClub?.golfCourseId ?? null,
	)
	const [size, setSize] = useState<string>(existingClub?.size?.toString() ?? "")
	const [archived, setArchived] = useState(existingClub?.archived ?? false)
	const [notes, setNotes] = useState(existingClub?.notes ?? "")

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			setError("Name is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveClubAction({
				id: existingClub?.id,
				name: name.trim(),
				website: website.trim(),
				golfCourseId,
				size: size ? (Number.isNaN(parseInt(size, 10)) ? null : parseInt(size, 10)) : null,
				archived,
				notes: notes.trim() || null,
			})

			if (result.success && result.data) {
				if (existingClub) {
					toast.success("Club updated")
					onRefresh?.()
				} else {
					toast.success("Club created")
					router.push(`/members/clubs/${result.data.id}`)
				}
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

	const handleCancel = () => {
		router.push("/members/clubs")
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading text-xl">Club Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave}>
					<div className="grid grid-cols-[30%_1fr] gap-6">
						{/* Left column */}
						<div className="space-y-4">
							{/* Name */}
							<Field>
								<FieldLabel htmlFor="name">
									Name <span className="text-destructive">*</span>
								</FieldLabel>
								<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
							</Field>

							{/* Website */}
							<Field>
								<FieldLabel htmlFor="website">Website</FieldLabel>
								<Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
							</Field>

							{/* Golf Course dropdown */}
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

							{/* Size */}
							<Field>
								<FieldLabel htmlFor="size">Size</FieldLabel>
								<Input
									id="size"
									type="number"
									value={size}
									onChange={(e) => setSize(e.target.value)}
								/>
							</Field>

							{/* Archived */}
							<Field orientation="horizontal">
								<Checkbox
									id="archived"
									checked={archived}
									onCheckedChange={(checked) => setArchived(checked === true)}
								/>
								<FieldLabel htmlFor="archived" className="mb-0">
									Archived
								</FieldLabel>
							</Field>
						</div>

						{/* Right column */}
						<div>
							<FieldLabel>Notes</FieldLabel>
							<MarkdownEditor
								value={notes}
								onChange={setNotes}
								minHeight="200px"
								maxHeight="400px"
							/>
						</div>
					</div>

					{/* Error message */}
					{error && <FieldError className="mt-4">{error}</FieldError>}

					{/* Action buttons */}
					<div className="flex justify-end pt-6">
						<div className="flex gap-2">
							<Button type="button" variant="secondaryoutline" onClick={handleCancel}>
								Cancel
							</Button>
							<Button type="submit" variant="secondary" disabled={saving}>
								{saving ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
					{existingClub?.updateDate && (
						<p className="pt-2 text-right text-xs text-gray-400">
							Last updated{" "}
							{new Date(existingClub.updateDate.replace(" ", "T") + "Z").toLocaleString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric",
								hour: "numeric",
								minute: "2-digit",
							})}
							{existingClub.updateBy && ` by ${existingClub.updateBy}`}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	)
}
