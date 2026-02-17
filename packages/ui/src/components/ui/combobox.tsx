"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "../../lib/utils"

interface ComboboxProps {
	options: { value: string; label: string }[]
	value: string
	onValueChange: (value: string) => void
	placeholder?: string
	searchPlaceholder?: string
	emptyMessage?: string
	className?: string
}

function Combobox({
	options,
	value,
	onValueChange,
	placeholder = "Select...",
	searchPlaceholder = "Search...",
	emptyMessage = "No results found.",
	className,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false)

	const selectedLabel = options.find((o) => o.value === value)?.label

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					role="combobox"
					aria-expanded={open}
					className={cn(
						"flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:shadow-[0_0_0_1px_#96c4d0,0_0_8px_rgba(150,196,208,0.4)] disabled:cursor-not-allowed disabled:opacity-50",
						!selectedLabel && "text-muted-foreground",
						className,
					)}
				>
					<span className="line-clamp-1">{selectedLabel ?? placeholder}</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</button>
			</PopoverTrigger>
			<PopoverContent>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.label}
									onSelect={() => {
										onValueChange(option.value === value ? "" : option.value)
										setOpen(false)
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === option.value ? "opacity-100" : "opacity-0",
										)}
									/>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

export { Combobox, type ComboboxProps }
