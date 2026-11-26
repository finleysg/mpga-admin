import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { dashboardRedirect } from "@/lib/roles"

import { DashboardLayoutClient } from "./dashboard-layout-client"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const headersList = await headers()
	const session = await auth.api.getSession({ headers: headersList })

	if (!session) {
		redirect("/login")
	}

	const role = session.user.role ?? null
	const target = dashboardRedirect(role, headersList.get("x-pathname") ?? "/")
	if (target) {
		redirect(target)
	}

	return <DashboardLayoutClient role={role}>{children}</DashboardLayoutClient>
}
