"use server"

import type { ActionResult } from "@mpga/types"

import type { ContentData } from "@/lib/content-actions"
import {
	getContentAction as getContent,
	saveContentAction as saveContent,
} from "@/lib/content-actions"

export async function getContentAction(): Promise<ActionResult<ContentData>> {
	return getContent("M")
}

export async function saveContentAction(data: {
	id?: number
	contentType: string
	title: string
	contentText: string
}): Promise<ActionResult<{ id: number }>> {
	return saveContent(data, "/match-play")
}
