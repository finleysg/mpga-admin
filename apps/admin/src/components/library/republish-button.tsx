"use client"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	toast,
} from "@mpga/ui"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { republishLatestAction } from "@/app/(dashboard)/library/actions"

export function RepublishButton({ fileId, count }: { fileId: number; count: number }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [busy, setBusy] = useState(false)

	async function republish(e: React.MouseEvent) {
		e.preventDefault()
		setBusy(true)
		const result = await republishLatestAction(fileId)
		setBusy(false)
		setOpen(false)
		if (result.success && result.data) {
			toast.success(
				`Updated ${result.data.updated} public cop${result.data.updated === 1 ? "y" : "ies"}`,
			)
			router.refresh()
		} else {
			toast.error(result.error ?? "Couldn't re-publish.")
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
			<AlertDialogTrigger asChild>
				<Button variant="secondaryoutline" size="sm">
					<RefreshCw className="h-4 w-4" />
					Re-publish latest
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="font-heading text-secondary-500">
						Re-publish the current version?
					</AlertDialogTitle>
					<AlertDialogDescription>
						{count === 1 ? "The public copy" : `All ${count} public copies`} showing an older
						version will be replaced with the current version.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={republish} disabled={busy}>
						{busy ? "Publishing…" : "Re-publish"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
