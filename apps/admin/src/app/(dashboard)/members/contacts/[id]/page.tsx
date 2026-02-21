"use client"

import { H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import {
	type ContactClubData,
	type ContactData,
	getContactAction,
	getContactClubsAction,
} from "../actions"
import { ContactForm } from "../contact-form"
import { ContactClubsSection } from "./contact-clubs-section"

export default function EditContactPage() {
	const params = useParams()
	const router = useRouter()
	const [contact, setContact] = useState<ContactData | null>(null)
	const [clubs, setClubs] = useState<ContactClubData[]>([])
	const [loading, setLoading] = useState(true)
	const contactId = Number(params.id)

	const fetchContact = useCallback(async () => {
		try {
			const [contactResult, clubsResult] = await Promise.all([
				getContactAction(contactId),
				getContactClubsAction(contactId),
			])
			if (contactResult.success && contactResult.data) {
				setContact(contactResult.data)
			}
			if (clubsResult.success && clubsResult.data) {
				setClubs(clubsResult.data)
			}
		} catch (err) {
			console.error("Failed to fetch contact:", err)
		}
	}, [contactId])

	useEffect(() => {
		if (isNaN(contactId)) {
			router.push("/members/contacts")
			return
		}

		async function load() {
			try {
				const [contactResult, clubsResult] = await Promise.all([
					getContactAction(contactId),
					getContactClubsAction(contactId),
				])
				if (contactResult.success && contactResult.data) {
					setContact(contactResult.data)
				} else {
					router.push("/members/contacts")
					return
				}
				if (clubsResult.success && clubsResult.data) {
					setClubs(clubsResult.data)
				}
			} catch (err) {
				console.error("Failed to fetch contact:", err)
				router.push("/members/contacts")
			} finally {
				setLoading(false)
			}
		}

		load()
	}, [contactId, router])

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl">
				<div className="py-8 text-center text-gray-500">Loading contact...</div>
			</div>
		)
	}

	if (!contact) {
		return null
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<H1 variant="secondary" className="mb-6">
				Edit Contact
			</H1>
			<ContactForm contact={contact} onRefresh={fetchContact} />
			<ContactClubsSection clubs={clubs} />
		</div>
	)
}
