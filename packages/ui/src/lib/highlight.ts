/**
 * Walks text nodes within `container`, wrapping case-insensitive matches
 * of `term` in <mark data-search-highlight> elements.
 * Returns the total number of matches found.
 */
export function highlightMatches(container: HTMLElement, term: string): number {
	const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	const regex = new RegExp(escaped, "gi")
	let matchCount = 0

	// Collect text nodes first to avoid modifying the tree while walking
	const textNodes: Text[] = []
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
	let node: Text | null
	while ((node = walker.nextNode() as Text | null)) {
		textNodes.push(node)
	}

	for (const textNode of textNodes) {
		const text = textNode.nodeValue
		if (!text) continue

		const matches = [...text.matchAll(regex)]
		if (matches.length === 0) continue

		matchCount += matches.length

		// Build a document fragment with text and mark elements
		const fragment = document.createDocumentFragment()
		let lastIndex = 0

		for (const match of matches) {
			const matchStart = match.index!
			const matchText = match[0]

			// Text before the match
			if (matchStart > lastIndex) {
				fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)))
			}

			// The match wrapped in <mark>
			const mark = document.createElement("mark")
			mark.dataset.searchHighlight = ""
			mark.textContent = matchText
			fragment.appendChild(mark)

			lastIndex = matchStart + matchText.length
		}

		// Remaining text after last match
		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
		}

		textNode.parentNode!.replaceChild(fragment, textNode)
	}

	return matchCount
}

/**
 * Removes all <mark data-search-highlight> elements within `container`,
 * restoring the original text nodes.
 */
export function clearHighlights(container: HTMLElement): void {
	const marks = container.querySelectorAll("mark[data-search-highlight]")
	for (const mark of marks) {
		const text = document.createTextNode(mark.textContent ?? "")
		mark.parentNode!.replaceChild(text, mark)
	}
	container.normalize()
}
