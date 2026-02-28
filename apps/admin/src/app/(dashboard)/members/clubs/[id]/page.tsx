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
import { listRolesAction } from "@/app/(dashboard)/settings/roles/actions"
import { ClubForm } from "../club-form"
import { ClubContactsSection, type RoleOption } from "./club-contacts-section"
import { ClubPaymentSection } from "./club-payment-section"

export default function EditClubPage() {
	const params = useParams()
	const router = useRouter()
	const [club, setClub] = useState<ClubData | null>(null)
	const [golfCourses, setGolfCourses] = useState<GolfCourseOption[]>([])
	const [contacts, setContacts] = useState<ClubContactData[]>([])
	const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([])
	const [membershipData, setMembershipData] = useState<MembershipData | null>(null)
	const [loading, setLoading] = useState(true)

	const clubId = Number(params.id)
	const currentYear = new Date().getFullYear()

	const fetchClub = useCallback(async () => {
		try {
			const result = await getClubAction(clubId)
			if (result.success && result.data) {
				setClub(result.data)
			}
		} catch (err) {
			console.error("Failed to fetch club:", err)
		}
	}, [clubId])

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
				const [clubResult, coursesResult, rolesResult] = await Promise.all([
					getClubAction(clubId),
					listGolfCourseOptionsAction(),
					listRolesAction(),
				])

				if (!clubResult.success || !clubResult.data) {
					router.push("/members/clubs")
					return
				}

				setClub(clubResult.data)
				if (coursesResult.success && coursesResult.data) {
					setGolfCourses(coursesResult.data)
				}
				if (rolesResult.success && rolesResult.data) {
					setAvailableRoles(rolesResult.data)
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
			<ClubForm club={club} golfCourses={golfCourses} onRefresh={fetchClub} />
			<ClubContactsSection
				clubId={clubId}
				contacts={contacts}
				availableRoles={availableRoles}
				onRefresh={fetchContacts}
			/>
			<ClubPaymentSection
				clubId={clubId}
				year={currentYear}
				membership={membershipData}
				onRefresh={fetchMembership}
			/>
		</div>
	)
}
