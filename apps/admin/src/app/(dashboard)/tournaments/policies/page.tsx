import { ContentSystemName } from "@mpga/types"
import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getContentAction, saveContentAction } from "./actions"

async function loadPoliciesContent() {
	"use server"
	const result = await getContentAction(ContentSystemName.TournamentPolicies)
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function savePoliciesContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveContentAction({
		id: data.id,
		systemName: ContentSystemName.TournamentPolicies,
		title: data.title,
		contentText: data.content,
	})
}

export default function EditPoliciesPage() {
	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				Edit Tournament Policies
			</H1>
			<ContentEditor
				loadContent={loadPoliciesContent}
				saveContent={savePoliciesContent}
				preview={{ heading: "h1" }}
			/>
		</div>
	)
}
