"use client"

import { Printer } from "lucide-react"

import { Button } from "./ui/button"

export function PrintButton() {
	return (
		<Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
			<Printer className="mr-1.5 h-4 w-4" />
			Print
		</Button>
	)
}
