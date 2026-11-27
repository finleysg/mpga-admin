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
	FieldError,
} from "@mpga/ui"
import { Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import type { ImportResult } from "@/lib/library/import-documents"
import { fileHref } from "@/lib/library/links"

import { importDocumentsBatchAction } from "./actions"

/** Runs the import batch by batch, showing progress, until every document is processed. */
export function ImportRunner({ total }: { total: number }) {
	const router = useRouter()
	const [running, setRunning] = useState(false)
	const [confirmOpen, setConfirmOpen] = useState(false)
	// A ref, not state: two clicks in the same tick would both still see running === false.
	const runningRef = useRef(false)
	const [results, setResults] = useState<ImportResult[]>([])
	const [error, setError] = useState<string | null>(null)
	const [done, setDone] = useState(false)

	async function run(e: React.MouseEvent) {
		e.preventDefault()
		setConfirmOpen(false)
		if (runningRef.current) return
		runningRef.current = true
		setRunning(true)
		setError(null)
		setDone(false)
		setResults([])
		let after: number | null = 0
		try {
			while (after !== null) {
				const result = await importDocumentsBatchAction(after)
				if (!result.success || !result.data) {
					setError(result.error ?? "The import stopped. It's safe to run again.")
					break
				}
				const batch = result.data
				setResults((prev) => [...prev, ...batch.results])
				after = batch.nextAfterDocumentId
			}
		} catch {
			setError("The import stopped (connection problem). It's safe to run again.")
		} finally {
			runningRef.current = false
			setRunning(false)
		}
		if (after === null) setDone(true)
		router.refresh()
	}

	const imported = results.filter((r) => r.status === "imported")
	const skipped = results.filter((r) => r.status === "skipped")

	return (
		<div className="space-y-4">
			<AlertDialog open={confirmOpen} onOpenChange={(next) => !running && setConfirmOpen(next)}>
				<AlertDialogTrigger asChild>
					<Button disabled={running || total === 0}>
						{running ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Download className="h-4 w-4" />
						)}
						{running ? "Importing…" : `Import ${total} document${total === 1 ? "" : "s"}`}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="font-heading text-secondary-500">
							Import documents?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Each document&apos;s file is copied into the library and linked to it. Public pages
							don&apos;t change. Documents already imported are skipped, so this is safe to run
							again.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={run} disabled={running}>
							Import
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{(running || results.length > 0) && (
				<p className="text-sm" aria-live="polite">
					{running ? "Working… " : done ? "Finished. " : "Stopped. "}
					{imported.length} imported, {skipped.length} skipped
					{running && ` (${results.length} of about ${total} processed)`}
				</p>
			)}
			{error && <FieldError>{error}</FieldError>}

			{skipped.length > 0 && !running && (
				<div className="text-sm">
					<p className="font-medium">Skipped</p>
					<ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
						{skipped.map((r) => (
							<li key={r.documentId}>
								{r.title} (document {r.documentId}): {r.reason}
							</li>
						))}
					</ul>
				</div>
			)}
			{done && imported.length > 0 && (
				<p className="text-sm">
					<Link href="/library" className="text-primary hover:underline">
						Open the library
					</Link>{" "}
					or the first imported file:{" "}
					<Link href={fileHref(imported[0]!.fileId!)} className="text-primary hover:underline">
						{imported[0]!.fileName}
					</Link>
				</p>
			)}
		</div>
	)
}
