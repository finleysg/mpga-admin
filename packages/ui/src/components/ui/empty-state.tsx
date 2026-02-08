import { cn } from "../../lib/utils"

export interface EmptyStateProps {
	message: string
	className?: string
}

export function EmptyState({ message, className }: EmptyStateProps) {
	return <div className={cn("py-8 text-center text-gray-500", className)}>{message}</div>
}
