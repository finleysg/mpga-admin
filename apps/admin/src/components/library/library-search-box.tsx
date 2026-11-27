import { Input } from "@mpga/ui"
import { Search } from "lucide-react"

/** Plain GET form, so search works before any JavaScript loads. */
export function LibrarySearchBox({ defaultValue = "" }: { defaultValue?: string }) {
	return (
		<form action="/library/search" method="get" role="search" className="relative w-full sm:w-72">
			<Search
				className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				aria-hidden
			/>
			<Input
				type="search"
				name="q"
				defaultValue={defaultValue}
				placeholder="Search documents"
				aria-label="Search documents"
				className="pl-9"
				minLength={2}
				maxLength={200}
				required
			/>
		</form>
	)
}
