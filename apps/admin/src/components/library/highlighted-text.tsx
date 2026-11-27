import { highlight } from "@/lib/library/highlight"

export function HighlightedText({ text, terms }: { text: string; terms: readonly string[] }) {
	return (
		<>
			{highlight(text, terms).map((part, i) =>
				part.match ? (
					<mark key={i} className="rounded-sm bg-amber-100 px-0.5 text-foreground">
						{part.text}
					</mark>
				) : (
					<span key={i}>{part.text}</span>
				),
			)}
		</>
	)
}
