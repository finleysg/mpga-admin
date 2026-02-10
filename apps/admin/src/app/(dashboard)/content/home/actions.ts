"use server"

import type { ActionResult } from "@mpga/types"

import type { ContentData } from "@/lib/content-actions"
import {
	getContentAction as getContent,
	saveContentAction as saveContent,
} from "@/lib/content-actions"

export async function getHomeContentAction(
	contentType: string,
): Promise<ActionResult<ContentData>> {
	return getContent(contentType)
}

export async function saveHomeContentAction(data: {
	id?: number
	contentType: string
	title: string
	contentText: string
}): Promise<ActionResult<{ id: number }>> {
	return saveContent(data, "/")
}
