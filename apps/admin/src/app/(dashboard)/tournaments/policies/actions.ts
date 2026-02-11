"use server"

import type { ActionResult } from "@mpga/types"

import type { ContentData } from "@/lib/content-actions"
import {
	getContentAction as getContent,
	saveContentAction as saveContent,
} from "@/lib/content-actions"

export async function getContentAction(systemName: string): Promise<ActionResult<ContentData>> {
	return getContent(systemName)
}

export async function saveContentAction(data: {
	id?: number
	systemName: string
	title: string
	contentText: string
}): Promise<ActionResult<{ id: number }>> {
	return saveContent(data, "/tournaments")
}
