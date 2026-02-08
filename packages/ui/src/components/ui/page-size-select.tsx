import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

export interface PageSizeSelectProps {
	value: string
	onChange: (value: string) => void
	options?: (number | "all")[]
}

export function PageSizeSelect({
	value,
	onChange,
	options = [10, 25, 50, "all"],
}: PageSizeSelectProps) {
	return (
		<div className="flex items-center gap-2">
			<label className="text-sm text-gray-600">Show:</label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="h-8 w-[70px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt} value={String(opt)}>
							{opt === "all" ? "All" : opt}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}
