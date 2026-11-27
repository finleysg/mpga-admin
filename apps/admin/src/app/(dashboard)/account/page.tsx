import { H1 } from "@mpga/ui"

import { ChangePasswordForm } from "./change-password-form"

export default function AccountPage() {
	return (
		<div className="mx-auto max-w-xl">
			<H1 variant="secondary" className="mb-6">
				Account
			</H1>
			<ChangePasswordForm />
		</div>
	)
}
