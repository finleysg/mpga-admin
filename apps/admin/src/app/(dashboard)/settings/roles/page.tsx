import { H1 } from "@mpga/ui"

import { listRolesAction } from "./actions"
import { RolesCard } from "./roles-card"

export default async function RolesPage() {
	const result = await listRolesAction()
	const roles = result.success && result.data ? result.data : []

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<H1 variant="secondary">Roles</H1>
			<RolesCard initialRoles={roles} />
		</div>
	)
}
