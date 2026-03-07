"use client"

import {
	Button,
	EmptyState,
	H1,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mpga/ui"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { useYearSearchParam } from "@/hooks/use-table-search-params"

import { type ClubOption, listClubOptionsAction } from "../actions"
import { type GroupWithTeams, getGroupTeamsAction } from "./actions"
import { GroupCard } from "./group-card"

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)

export default function TeamSetupPage() {
	const [year, setYear] = useYearSearchParam(currentYear)
	const [groups, setGroups] = useState<GroupWithTeams[]>([])
	const [clubOptions, setClubOptions] = useState<ClubOption[]>([])
	const [loading, setLoading] = useState(true)
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	// Clubs don't change by year — fetch once
	useEffect(() => {
		async function fetchClubs() {
			const result = await listClubOptionsAction()
			if (result.success && result.data) {
				setClubOptions(result.data)
			}
		}
		fetchClubs()
	}, [])

	const fetchGroups = useCallback(async (y: number) => {
		setLoading(true)
		try {
			const result = await getGroupTeamsAction(y)
			if (result.success && result.data) {
				setGroups(result.data)
			}
		} catch (err) {
			console.error("Failed to load groups:", err)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchGroups(year)
	}, [year, fetchGroups])

	const handleSaved = () => {
		fetchGroups(year)
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6 flex items-center justify-between">
				<H1 variant="secondary">Season Setup</H1>
				<Button variant="secondaryoutline" asChild>
					<Link href="/match-play/teams">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Teams
					</Link>
				</Button>
			</div>

			{/* Year selector */}
			<div className="mb-6 flex items-center gap-2">
				<span className="text-sm font-medium text-gray-700">Year:</span>
				{mounted ? (
					<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{yearOptions.map((y) => (
								<SelectItem key={y} value={String(y)}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<div className="h-9 w-28 rounded-md border bg-transparent" />
				)}
			</div>

			{loading ? (
				<EmptyState message="Loading groups..." />
			) : groups.length === 0 ? (
				<div className="py-8 text-center">
					<p className="mb-4 text-gray-500">No groups defined for {year}. Create groups first.</p>
					<Button variant="secondary" asChild>
						<Link href="/match-play/groups">Manage Groups</Link>
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					{groups.map((group) => (
						<GroupCard
							key={group.id}
							group={group}
							year={year}
							clubOptions={clubOptions}
							onSaved={handleSaved}
						/>
					))}
				</div>
			)}
		</div>
	)
}
