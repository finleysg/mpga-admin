import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getContentAction, saveContentAction } from "../actions"

async function loadPoliciesContent() {
	"use server"
	const result = await getContentAction("TP")
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
		contentType: "TP",
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
				backHref="/tournaments/policies"
				loadContent={loadPoliciesContent}
				saveContent={savePoliciesContent}
			/>
		</div>
	)
}
