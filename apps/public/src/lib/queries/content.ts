import { content } from "@mpga/database"
import { ContentSystemName } from "@mpga/types"
import { eq, inArray } from "drizzle-orm"

import { db } from "../db"

export interface FeatureCard {
	systemName: string
	title: string
	description: string
}

export interface Content {
	title: string
	content: string
}

export async function getFeatureCards(): Promise<FeatureCard[]> {
	try {
		const results = await db
			.select({
				systemName: content.systemName,
				title: content.title,
				description: content.contentText,
			})
			.from(content)
			.where(
				inArray(content.systemName, [
					ContentSystemName.HomeTournaments,
					ContentSystemName.HomeMatchPlay,
					ContentSystemName.HomeClubs,
				]),
			)

		return results
	} catch (error) {
		console.error("Failed to fetch feature cards:", error)
		return []
	}
}

export async function getAboutContent(): Promise<Content | null> {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.Home))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch about content:", error)
		return null
	}
}

export async function getMatchPlayContent(): Promise<Content | null> {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.MatchPlay))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch match play content:", error)
		return null
	}
}

export async function getMatchPlayRules(): Promise<Content | null> {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.MatchPlayRules))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch match play rules:", error)
		return null
	}
}

export async function getSeniorMatchPlayRules(): Promise<Content | null> {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.SeniorMatchPlayRules))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch senior match play rules:", error)
		return null
	}
}

export async function getTournamentPolicies(): Promise<Content | null> {
	try {
		const results = await db
			.select({
				title: content.title,
				content: content.contentText,
			})
			.from(content)
			.where(eq(content.systemName, ContentSystemName.TournamentPolicies))
			.limit(1)

		return results[0] || null
	} catch (error) {
		console.error("Failed to fetch tournament policies:", error)
		return null
	}
}
