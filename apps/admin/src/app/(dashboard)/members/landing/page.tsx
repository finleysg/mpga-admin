import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getContentAction, saveContentAction } from "./actions"

async function loadLandingContent() {
	"use server"
	const result = await getContentAction()
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveLandingContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveContentAction({
		id: data.id,
		contentType: "C",
		title: data.title,
		contentText: data.content,
	})
}

export default function MembersLandingPagePage() {
	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-2">
				Members Landing Page
			</H1>
			<p className="mb-6 text-muted-foreground">
				This content is displayed at the top of the Members page on the public site, above the clubs
				membership table.
			</p>
			<ContentEditor
				loadContent={loadLandingContent}
				saveContent={saveLandingContent}
				preview={{ heading: "h1" }}
			/>
		</div>
	)
}
