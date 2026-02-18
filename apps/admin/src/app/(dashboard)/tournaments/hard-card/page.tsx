import { ContentSystemName } from "@mpga/types"
import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getContentAction, saveContentAction } from "./actions"

async function loadHardCardContent() {
	"use server"
	const result = await getContentAction(ContentSystemName.HardCard)
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveHardCardContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveContentAction({
		id: data.id,
		systemName: ContentSystemName.HardCard,
		title: data.title,
		contentText: data.content,
	})
}

export default function EditHardCardPage() {
	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				Edit Hard Card
			</H1>
			<ContentEditor
				loadContent={loadHardCardContent}
				saveContent={saveHardCardContent}
				preview={{ heading: "h1" }}
			/>
		</div>
	)
}
