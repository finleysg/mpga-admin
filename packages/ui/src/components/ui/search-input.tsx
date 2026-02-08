import { Search } from "lucide-react"
import * as React from "react"

import { cn } from "../../lib/utils"

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	variant?: "primary" | "secondary"
}

export function SearchInput({ variant = "primary", className, ...props }: SearchInputProps) {
	return (
		<div className="relative">
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				className={cn(
					"w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 sm:w-64",
					variant === "primary"
						? "focus:border-primary-500 focus:ring-primary-500"
						: "focus:border-secondary-500 focus:ring-secondary-500",
					className,
				)}
				{...props}
			/>
		</div>
	)
}
