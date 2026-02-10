import { H1 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getContentAction, saveContentAction } from "./actions"

async function loadAboutContent() {
	"use server"
	const result = await getContentAction()
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveAboutContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveContentAction({
		id: data.id,
		contentType: "A",
		title: data.title,
		contentText: data.content,
	})
}

export default function AboutUsPage() {
	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-2">
				About Us
			</H1>
			<p className="mb-6 text-muted-foreground">
				This content is displayed on the About Us page on the public site.
			</p>
			<ContentEditor
				loadContent={loadAboutContent}
				saveContent={saveAboutContent}
				preview={{ heading: "h1" }}
			/>
		</div>
	)
}
