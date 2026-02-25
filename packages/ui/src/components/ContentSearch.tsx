"use client"

import { ArrowDown, Search, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { clearHighlights, highlightMatches } from "../lib/highlight"

export interface ContentSearchProps {
	containerId: string
}

export function ContentSearch({ containerId }: ContentSearchProps) {
	const [query, setQuery] = useState("")
	const [matchCount, setMatchCount] = useState(0)
	const [currentIndex, setCurrentIndex] = useState(0)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

	const performSearch = useCallback(
		(term: string) => {
			const container = document.getElementById(containerId)
			if (!container) return

			clearHighlights(container)

			if (!term.trim()) {
				setMatchCount(0)
				setCurrentIndex(0)
				return
			}

			const count = highlightMatches(container, term.trim())
			setMatchCount(count)
			setCurrentIndex(0)
		},
		[containerId],
	)

	const scrollToNext = useCallback(() => {
		const container = document.getElementById(containerId)
		if (!container || matchCount === 0) return

		const marks = container.querySelectorAll("mark[data-search-highlight]")
		const mark = marks[currentIndex]
		mark?.scrollIntoView({ behavior: "smooth", block: "center" })
		setCurrentIndex((currentIndex + 1) % matchCount)
	}, [containerId, matchCount, currentIndex])

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => performSearch(query), 300)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [query, performSearch])

	useEffect(() => {
		return () => {
			const container = document.getElementById(containerId)
			if (container) clearHighlights(container)
		}
	}, [containerId])

	const handleClear = () => {
		setQuery("")
		setMatchCount(0)
		setCurrentIndex(0)
		const container = document.getElementById(containerId)
		if (container) clearHighlights(container)
	}

	return (
		<div className="print:hidden flex items-center gap-2">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search..."
					className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-64"
				/>
				{query && (
					<button
						onClick={handleClear}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						aria-label="Clear search"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>
			{query.trim() && (
				<div className="flex items-center gap-1.5">
					<span className="text-xs text-muted-foreground whitespace-nowrap">
						{matchCount} {matchCount === 1 ? "match" : "matches"}
					</span>
					{matchCount > 0 && (
						<button
							onClick={scrollToNext}
							className="inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80"
							aria-label="Find next match"
						>
							<ArrowDown className="h-3 w-3" />
							find
						</button>
					)}
				</div>
			)}
		</div>
	)
}
