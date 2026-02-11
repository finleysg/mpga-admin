import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import {
	getECContentAction,
	listClubOptionsAction,
	listCommitteeMembersAction,
	listContactOptionsAction,
	saveECContentAction,
} from "./actions"
import { MembersCard } from "./members-card"

export default async function ExecutiveCommitteePage() {
	async function loadEC() {
		"use server"
		const result = await getECContentAction()
		if (!result.success || !result.data) return null
		return {
			title: result.data.title,
			content: result.data.contentText,
			id: result.data.id,
		}
	}

	async function saveEC(data: { id?: number; title: string; content: string }) {
		"use server"
		return saveECContentAction(data)
	}

	const [membersResult, contactsResult, clubsResult] = await Promise.all([
		listCommitteeMembersAction(),
		listContactOptionsAction(),
		listClubOptionsAction(),
	])

	const members = membersResult.success && membersResult.data ? membersResult.data : []
	const contacts = contactsResult.success && contactsResult.data ? contactsResult.data : []
	const clubs = clubsResult.success && clubsResult.data ? clubsResult.data : []

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<H1 variant="secondary" className="mb-6">
				Executive Committee
			</H1>
			<ContentEditor loadContent={loadEC} saveContent={saveEC} />
			<MembersCard initialMembers={members} contacts={contacts} clubs={clubs} />
		</div>
	)
}
