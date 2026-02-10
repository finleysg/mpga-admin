"use client"

import { H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { type GolfCourseData, getGolfCourseAction } from "../actions"
import { GolfCourseForm } from "../golf-course-form"

export default function EditGolfCoursePage() {
	const params = useParams()
	const router = useRouter()
	const [golfCourse, setGolfCourse] = useState<GolfCourseData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchGolfCourse() {
			const id = Number(params.id)
			if (isNaN(id)) {
				router.push("/members/golf-courses")
				return
			}

			try {
				const result = await getGolfCourseAction(id)
				if (result.success && result.data) {
					setGolfCourse(result.data)
				} else {
					router.push("/members/golf-courses")
				}
			} catch (err) {
				console.error("Failed to fetch golf course:", err)
				router.push("/members/golf-courses")
			} finally {
				setLoading(false)
			}
		}

		fetchGolfCourse()
	}, [params.id, router])

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl">
				<div className="py-8 text-center text-gray-500">Loading golf course...</div>
			</div>
		)
	}

	if (!golfCourse) {
		return null
	}

	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				Edit Golf Course
			</H1>
			<GolfCourseForm golfCourse={golfCourse} />
		</div>
	)
}
