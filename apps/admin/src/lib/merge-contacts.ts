import type { ContactData } from "@/app/(dashboard)/members/contacts/actions"

const fillableFields = [
	"primaryPhone",
	"alternatePhone",
	"email",
	"addressText",
	"city",
	"state",
	"zip",
	"notes",
] as const

/**
 * Determines which fields to fill on the target contact from source contacts.
 * For each fillable field that is empty on the target, takes the value from
 * the first source contact that has it.
 */
export function buildMergeFieldUpdates(
	target: ContactData,
	sources: ContactData[],
): Record<string, string> {
	const updates: Record<string, string> = {}
	for (const field of fillableFields) {
		if (!target[field]) {
			const donor = sources.find((s) => s[field])
			if (donor) {
				updates[field] = donor[field] as string
			}
		}
	}
	return updates
}

/**
 * Decides whether a source contact's club-contact row should be reassigned
 * to the target or deleted (because the target already has that club).
 */
export function classifyClubContact(
	sourceClubId: number,
	targetClubIds: Set<number>,
): "reassign" | "delete" {
	return targetClubIds.has(sourceClubId) ? "delete" : "reassign"
}

/**
 * Decides whether a source contact's committee row should be reassigned
 * to the target or deleted (because the target already has that role+homeClub).
 */
export function classifyCommittee(
	role: string,
	homeClubId: number,
	targetKeys: Set<string>,
): "reassign" | "delete" {
	const key = `${role}|${homeClubId}`
	return targetKeys.has(key) ? "delete" : "reassign"
}
