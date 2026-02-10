"use client"

import { H1 } from "@mpga/ui"

import { GolfCourseForm } from "../golf-course-form"

export default function NewGolfCoursePage() {
	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				New Golf Course
			</H1>
			<GolfCourseForm />
		</div>
	)
}
