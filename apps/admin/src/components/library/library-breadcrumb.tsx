import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@mpga/ui"
import Link from "next/link"
import { Fragment } from "react"

import { folderHref } from "@/lib/library/links"
import type { FolderSummary } from "@/lib/library/service"

/** "All folders / Board / Minutes", with every level but the last linked. */
export function LibraryBreadcrumb({
	path,
	current,
}: {
	path: FolderSummary[]
	/** Shown last, unlinked (a file name). Omit to make the last folder current. */
	current?: string
}) {
	const crumbs = [{ id: null as number | null, name: "All folders" }, ...path]
	return (
		<Breadcrumb>
			<BreadcrumbList>
				{crumbs.map((c, i) => {
					const isLast = current === undefined && i === crumbs.length - 1
					return (
						<Fragment key={c.id ?? "root"}>
							{i > 0 && <BreadcrumbSeparator />}
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{c.name}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link href={folderHref(c.id)}>{c.name}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</Fragment>
					)
				})}
				{current !== undefined && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="truncate">{current}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
