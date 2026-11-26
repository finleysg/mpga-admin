"use client"

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Separator,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@mpga/ui"
import { usePathname, useRouter } from "next/navigation"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Fragment, useEffect } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { dashboardRedirect } from "@/lib/roles"

function formatSegment(segment: string) {
	return segment
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

export function DashboardLayoutClient({
	children,
	role,
}: {
	children: React.ReactNode
	role: string | null
}) {
	const pathname = usePathname()
	const router = useRouter()
	const segments = pathname.split("/").filter(Boolean)
	// The server layout gates full page loads; this covers client-side navigation.
	const redirectTo = dashboardRedirect(role, pathname)

	useEffect(() => {
		if (redirectTo) router.replace(redirectTo)
	}, [redirectTo, router])

	return (
		<NuqsAdapter>
			<SidebarProvider>
				<AppSidebar userRole={role} />
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
						<Breadcrumb>
							<BreadcrumbList>
								{segments.map((segment, index) => {
									const href = "/" + segments.slice(0, index + 1).join("/")

									return (
										<Fragment key={href}>
											{index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
											<BreadcrumbItem>
												<BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
											</BreadcrumbItem>
										</Fragment>
									)
								})}
							</BreadcrumbList>
						</Breadcrumb>
					</header>
					<div className="flex-1 p-4">{redirectTo ? null : children}</div>
				</SidebarInset>
			</SidebarProvider>
		</NuqsAdapter>
	)
}
