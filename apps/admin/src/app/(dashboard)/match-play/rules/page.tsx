import { ContentSystemName } from "@mpga/types"
import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getContentAction, saveContentAction } from "./actions"

async function loadRulesContent() {
	"use server"
	const result = await getContentAction()
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveRulesContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveContentAction({
		id: data.id,
		systemName: ContentSystemName.MatchPlayRules,
		title: data.title,
		contentText: data.content,
	})
}

export default function MatchPlayRulesPage() {
	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				Match Play Rules
			</H1>
			<ContentEditor
				loadContent={loadRulesContent}
				saveContent={saveRulesContent}
				preview={{ heading: "h1" }}
			/>
		</div>
	)
}
