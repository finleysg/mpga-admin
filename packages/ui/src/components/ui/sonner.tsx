"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
	return (
		<Sonner
			position="top-right"
			richColors
			toastOptions={{
				classNames: {
					success: "!bg-secondary-100 !text-secondary-900 !border-secondary-300",
				},
			}}
			{...props}
		/>
	)
}

export { Toaster }
