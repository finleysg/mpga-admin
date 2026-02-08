import { cn } from "../../lib/utils"

export interface PageSizeSelectProps {
	value: string
	onChange: (value: string) => void
	options?: (number | "all")[]
	variant?: "primary" | "secondary"
}

export function PageSizeSelect({
	value,
	onChange,
	options = [10, 25, 50, "all"],
	variant = "primary",
}: PageSizeSelectProps) {
	return (
		<div className="flex items-center gap-2">
			<label htmlFor="pageSize" className="text-sm text-gray-600">
				Show:
			</label>
			<select
				id="pageSize"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={cn(
					"rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1",
					variant === "primary"
						? "focus:border-primary-500 focus:ring-primary-500"
						: "focus:border-secondary-500 focus:ring-secondary-500",
				)}
			>
				{options.map((opt) => (
					<option key={opt} value={opt}>
						{opt === "all" ? "All" : opt}
					</option>
				))}
			</select>
		</div>
	)
}
