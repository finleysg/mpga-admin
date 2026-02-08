import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../lib/utils"

const h1Variants = cva("text-3xl font-bold font-heading", {
	variants: {
		variant: {
			primary: "text-primary-900",
			secondary: "text-secondary-500",
		},
	},
	defaultVariants: {
		variant: "primary",
	},
})

const h2Variants = cva("text-2xl font-bold font-heading", {
	variants: {
		variant: {
			primary: "text-primary-900",
			secondary: "text-secondary-500",
		},
	},
	defaultVariants: {
		variant: "primary",
	},
})

const h3Variants = cva("text-xl font-semibold font-heading", {
	variants: {
		variant: {
			primary: "text-primary-700",
			secondary: "text-secondary-400",
		},
	},
	defaultVariants: {
		variant: "primary",
	},
})

const h4Variants = cva("text-lg font-semibold font-heading", {
	variants: {
		variant: {
			primary: "text-primary-700",
			secondary: "text-secondary-400",
		},
	},
	defaultVariants: {
		variant: "primary",
	},
})

export interface HeadingProps
	extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof h1Variants> {}

const H1 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
	({ className, variant, ...props }, ref) => {
		return <h1 className={cn(h1Variants({ variant, className }))} ref={ref} {...props} />
	},
)
H1.displayName = "H1"

const H2 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
	({ className, variant, ...props }, ref) => {
		return <h2 className={cn(h2Variants({ variant, className }))} ref={ref} {...props} />
	},
)
H2.displayName = "H2"

const H3 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
	({ className, variant, ...props }, ref) => {
		return <h3 className={cn(h3Variants({ variant, className }))} ref={ref} {...props} />
	},
)
H3.displayName = "H3"

const H4 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
	({ className, variant, ...props }, ref) => {
		return <h4 className={cn(h4Variants({ variant, className }))} ref={ref} {...props} />
	},
)
H4.displayName = "H4"

export { H1, H2, H3, H4, h1Variants, h2Variants, h3Variants, h4Variants }
