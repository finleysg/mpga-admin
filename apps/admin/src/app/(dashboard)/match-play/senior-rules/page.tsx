import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getContentAction, saveContentAction } from "./actions"

async function loadSeniorRulesContent() {
	"use server"
	const result = await getContentAction()
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveSeniorRulesContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveContentAction({
		id: data.id,
		contentType: "SP",
		title: data.title,
		contentText: data.content,
	})
}

export default function SeniorMatchPlayRulesPage() {
	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				Senior Match Play Rules
			</H1>
			<ContentEditor
				loadContent={loadSeniorRulesContent}
				saveContent={saveSeniorRulesContent}
				preview={{ heading: "h1" }}
			/>
		</div>
	)
}
