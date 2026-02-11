import { ContentSystemName } from "@mpga/types"
import { H1, H2 } from "@mpga/ui"

import { ContentEditor } from "@/components/content-editor"

import { getHomeContentAction, saveHomeContentAction } from "./actions"

async function loadAboutContent() {
	"use server"
	const result = await getHomeContentAction(ContentSystemName.Home)
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveAboutContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveHomeContentAction({
		id: data.id,
		systemName: ContentSystemName.Home,
		title: data.title,
		contentText: data.content,
	})
}

async function loadTournamentsContent() {
	"use server"
	const result = await getHomeContentAction(ContentSystemName.HomeTournaments)
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveTournamentsContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveHomeContentAction({
		id: data.id,
		systemName: ContentSystemName.HomeTournaments,
		title: data.title,
		contentText: data.content,
	})
}

async function loadMatchPlayContent() {
	"use server"
	const result = await getHomeContentAction(ContentSystemName.HomeMatchPlay)
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveMatchPlayContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveHomeContentAction({
		id: data.id,
		systemName: ContentSystemName.HomeMatchPlay,
		title: data.title,
		contentText: data.content,
	})
}

async function loadMembersContent() {
	"use server"
	const result = await getHomeContentAction(ContentSystemName.HomeClubs)
	if (!result.success || !result.data) return null
	return {
		title: result.data.title,
		content: result.data.contentText,
		id: result.data.id,
	}
}

async function saveMembersContent(data: { id?: number; title: string; content: string }) {
	"use server"
	return saveHomeContentAction({
		id: data.id,
		systemName: ContentSystemName.HomeClubs,
		title: data.title,
		contentText: data.content,
	})
}

export default function HomePagePage() {
	return (
		<div className="mx-auto max-w-6xl space-y-8">
			<div>
				<H1 variant="secondary" className="mb-2">
					Home Page
				</H1>
				<p className="text-muted-foreground">
					Manage the content displayed on the public home page.
				</p>
			</div>

			<section className="space-y-4">
				<H2 variant="secondary">About Section</H2>
				<ContentEditor
					loadContent={loadAboutContent}
					saveContent={saveAboutContent}
					preview={{ heading: "h1" }}
				/>
			</section>

			<section className="space-y-4">
				<H2 variant="secondary">Feature Cards</H2>
				<p className="text-muted-foreground">
					These cards appear below the about section on the home page.
				</p>
				<ContentEditor
					loadContent={loadTournamentsContent}
					saveContent={saveTournamentsContent}
					preview={{ heading: "h3" }}
				/>
				<ContentEditor
					loadContent={loadMatchPlayContent}
					saveContent={saveMatchPlayContent}
					preview={{ heading: "h3" }}
				/>
				<ContentEditor
					loadContent={loadMembersContent}
					saveContent={saveMembersContent}
					preview={{ heading: "h3" }}
				/>
			</section>
		</div>
	)
}
