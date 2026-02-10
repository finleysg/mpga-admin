"use client"

import { EmptyState, H1 } from "@mpga/ui"
import { useEffect, useState } from "react"

import { type GolfCourseOption, listGolfCourseOptionsAction } from "../actions"
import { ClubForm } from "../club-form"

export default function NewClubPage() {
	const [golfCourses, setGolfCourses] = useState<GolfCourseOption[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchOptions() {
			try {
				const result = await listGolfCourseOptionsAction()
				if (result.success && result.data) {
					setGolfCourses(result.data)
				} else {
					setError(result.error ?? "Failed to load golf course options")
				}
			} catch (err) {
				console.error("Failed to fetch golf courses:", err)
				setError("Failed to load golf course options")
			} finally {
				setLoading(false)
			}
		}

		fetchOptions()
	}, [])

	if (loading) {
		return (
			<div className="mx-auto max-w-6xl">
				<EmptyState message="Loading..." />
			</div>
		)
	}

	if (error) {
		return (
			<div className="mx-auto max-w-6xl">
				<EmptyState message={error} />
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				New Club
			</H1>
			<ClubForm golfCourses={golfCourses} />
		</div>
	)
}
