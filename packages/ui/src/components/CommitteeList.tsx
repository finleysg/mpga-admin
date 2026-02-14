"use client"

import { CollapsibleList } from "./CollapsibleList"

export interface CommitteeListProps {
	members: { role: string; name: string; clubName: string }[]
}

export function CommitteeList({ members }: CommitteeListProps) {
	if (members.length === 0) {
		return <p className="text-sm text-gray-500">No committee members listed.</p>
	}

	return (
		<ul className="space-y-3">
			<CollapsibleList maxItems={10}>
				{members.map((member, i) => (
					<li key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
						<p className="font-semibold text-primary-700">{member.role}</p>
						<p className="text-sm text-gray-600">
							{member.name} — {member.clubName}
						</p>
					</li>
				))}
			</CollapsibleList>
		</ul>
	)
}
