// Password rules shared by the reset and change-password forms. These match better-auth's
// defaults (minPasswordLength 8, maxPasswordLength 128), which the server enforces.

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

/** A message describing what's wrong with a new password, or null if it's acceptable. */
export function passwordProblem(password: string, confirm: string): string | null {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
	}
	if (password.length > MAX_PASSWORD_LENGTH) {
		return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`
	}
	if (password !== confirm) return "The passwords don't match."
	return null
}
