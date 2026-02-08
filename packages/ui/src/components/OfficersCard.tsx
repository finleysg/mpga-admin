import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { H2 } from "./ui/heading"

export interface Officer {
	id: number
	firstName: string
	lastName: string
	email?: string | null
	isPrimary: boolean
	roles: string[]
}

export interface OfficersCardProps {
	officers: Officer[]
}

export function OfficersCard({ officers }: OfficersCardProps) {
	if (officers.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>
						<H2 className="text-lg">Officers and Contacts</H2>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-500">No officers listed.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<H2 className="text-lg">Officers and Contacts</H2>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-3">
					{officers.map((officer) => (
						<li key={officer.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
							{officer.roles.length > 0 && (
								<p className="font-semibold text-secondary-500">{officer.roles.join(", ")}</p>
							)}
							<p className="text-sm text-gray-600">
								{officer.firstName} {officer.lastName}
							</p>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	)
}
