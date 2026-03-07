import { H1 } from "@mpga/ui"

import { GroupsManager } from "./groups-manager"

export default function MatchPlayGroupsPage() {
	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				Match Play Groups
			</H1>
			<GroupsManager />
		</div>
	)
}
