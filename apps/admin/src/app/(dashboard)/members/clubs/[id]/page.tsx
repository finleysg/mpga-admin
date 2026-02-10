"use client"

import { EmptyState, H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import {
	type ClubContactData,
	type ClubData,
	type GolfCourseOption,
	type MembershipData,
	getClubAction,
	getClubMembershipAction,
	listClubContactsAction,
	listGolfCourseOptionsAction,
} from "../actions"
import { ClubForm } from "../club-form"
import { ClubContactsSection } from "./club-contacts-section"
import { ClubPaymentSection } from "./club-payment-section"

export default function EditClubPage() {
	const params = useParams()
	const router = useRouter()
	const [club, setClub] = useState<ClubData | null>(null)
	const [golfCourses, setGolfCourses] = useState<GolfCourseOption[]>([])
	const [contacts, setContacts] = useState<ClubContactData[]>([])
	const [membershipData, setMembershipData] = useState<MembershipData | null>(null)
	const [loading, setLoading] = useState(true)

	const clubId = Number(params.id)
	const currentYear = new Date().getFullYear()

	const fetchContacts = useCallback(async () => {
		try {
			const result = await listClubContactsAction(clubId)
			if (result.success && result.data) {
				setContacts(result.data)
			}
		} catch (err) {
			console.error("Failed to fetch contacts:", err)
		}
	}, [clubId])

	const fetchMembership = useCallback(async () => {
		try {
			const result = await getClubMembershipAction(clubId, currentYear)
			if (result.success) {
				setMembershipData(result.data ?? null)
			}
		} catch (err) {
			console.error("Failed to fetch membership:", err)
		}
	}, [clubId, currentYear])

	useEffect(() => {
		if (isNaN(clubId)) {
			router.push("/members/clubs")
			return
		}

		async function fetchAll() {
			try {
				const [clubResult, coursesResult] = await Promise.all([
					getClubAction(clubId),
					listGolfCourseOptionsAction(),
				])

				if (!clubResult.success || !clubResult.data) {
					router.push("/members/clubs")
					return
				}

				setClub(clubResult.data)
				if (coursesResult.success && coursesResult.data) {
					setGolfCourses(coursesResult.data)
				}

				await Promise.all([fetchContacts(), fetchMembership()])
			} catch (err) {
				console.error("Failed to load club:", err)
				router.push("/members/clubs")
			} finally {
				setLoading(false)
			}
		}

		fetchAll()
	}, [clubId, router, fetchContacts, fetchMembership])

	if (loading) {
		return (
			<div className="mx-auto max-w-6xl">
				<EmptyState message="Loading club..." />
			</div>
		)
	}

	if (!club) {
		return null
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<H1 variant="secondary">Edit Club</H1>
			<ClubForm club={club} golfCourses={golfCourses} />
			<ClubContactsSection clubId={clubId} contacts={contacts} onRefresh={fetchContacts} />
			<ClubPaymentSection
				clubId={clubId}
				year={currentYear}
				membership={membershipData}
				onRefresh={fetchMembership}
			/>
		</div>
	)
}
