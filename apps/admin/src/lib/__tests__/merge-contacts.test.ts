import { describe, expect, it } from "vitest"

import type { ContactData } from "@/app/(dashboard)/members/contacts/actions"

import { buildMergeFieldUpdates, classifyClubContact, classifyCommittee } from "../merge-contacts"

function makeContact(
	overrides: Partial<ContactData> & { id: number; firstName: string; lastName: string },
): ContactData {
	return {
		primaryPhone: null,
		alternatePhone: null,
		email: null,
		addressText: null,
		city: null,
		state: null,
		zip: null,
		notes: null,
		sendEmail: true,
		updateDate: null,
		updateBy: null,
		...overrides,
	}
}

describe("buildMergeFieldUpdates", () => {
	it("returns empty object when target has all fields filled", () => {
		const target = makeContact({
			id: 1,
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			primaryPhone: "612-555-1234",
			alternatePhone: "651-555-9999",
			addressText: "123 Main St",
			city: "Minneapolis",
			state: "MN",
			zip: "55401",
			notes: "Some notes",
		})
		const sources = [
			makeContact({
				id: 2,
				firstName: "John",
				lastName: "Doe",
				email: "other@example.com",
				primaryPhone: "999-999-9999",
			}),
		]
		expect(buildMergeFieldUpdates(target, sources)).toEqual({})
	})

	it("fills missing email from source", () => {
		const target = makeContact({ id: 1, firstName: "John", lastName: "Doe" })
		const sources = [
			makeContact({ id: 2, firstName: "John", lastName: "Doe", email: "john@example.com" }),
		]
		const updates = buildMergeFieldUpdates(target, sources)
		expect(updates).toEqual({ email: "john@example.com" })
	})

	it("fills missing phone from source", () => {
		const target = makeContact({ id: 1, firstName: "John", lastName: "Doe" })
		const sources = [
			makeContact({ id: 2, firstName: "John", lastName: "Doe", primaryPhone: "612-555-1234" }),
		]
		const updates = buildMergeFieldUpdates(target, sources)
		expect(updates).toEqual({ primaryPhone: "612-555-1234" })
	})

	it("uses first source's value when multiple sources have the field", () => {
		const target = makeContact({ id: 1, firstName: "John", lastName: "Doe" })
		const sources = [
			makeContact({ id: 2, firstName: "John", lastName: "Doe", email: "first@example.com" }),
			makeContact({ id: 3, firstName: "John", lastName: "Doe", email: "second@example.com" }),
		]
		const updates = buildMergeFieldUpdates(target, sources)
		expect(updates.email).toBe("first@example.com")
	})

	it("fills multiple missing fields from different sources", () => {
		const target = makeContact({ id: 1, firstName: "John", lastName: "Doe" })
		const sources = [
			makeContact({ id: 2, firstName: "John", lastName: "Doe", email: "john@example.com" }),
			makeContact({
				id: 3,
				firstName: "John",
				lastName: "Doe",
				primaryPhone: "612-555-1234",
				city: "St Paul",
			}),
		]
		const updates = buildMergeFieldUpdates(target, sources)
		expect(updates).toEqual({
			email: "john@example.com",
			primaryPhone: "612-555-1234",
			city: "St Paul",
		})
	})

	it("does not overwrite existing target fields", () => {
		const target = makeContact({
			id: 1,
			firstName: "John",
			lastName: "Doe",
			email: "existing@example.com",
		})
		const sources = [
			makeContact({
				id: 2,
				firstName: "John",
				lastName: "Doe",
				email: "other@example.com",
				city: "Minneapolis",
			}),
		]
		const updates = buildMergeFieldUpdates(target, sources)
		expect(updates).toEqual({ city: "Minneapolis" })
		expect(updates.email).toBeUndefined()
	})

	it("returns empty object when sources have no data to contribute", () => {
		const target = makeContact({ id: 1, firstName: "John", lastName: "Doe" })
		const sources = [makeContact({ id: 2, firstName: "Jane", lastName: "Doe" })]
		expect(buildMergeFieldUpdates(target, sources)).toEqual({})
	})
})

describe("classifyClubContact", () => {
	it("returns 'delete' when target already has that club", () => {
		const targetClubIds = new Set([10, 20, 30])
		expect(classifyClubContact(20, targetClubIds)).toBe("delete")
	})

	it("returns 'reassign' when target does not have that club", () => {
		const targetClubIds = new Set([10, 20, 30])
		expect(classifyClubContact(40, targetClubIds)).toBe("reassign")
	})

	it("returns 'reassign' when target has no clubs", () => {
		const targetClubIds = new Set<number>()
		expect(classifyClubContact(10, targetClubIds)).toBe("reassign")
	})
})

describe("classifyCommittee", () => {
	it("returns 'delete' when target has same role and homeClub", () => {
		const targetKeys = new Set(["President|10", "Treasurer|20"])
		expect(classifyCommittee("President", 10, targetKeys)).toBe("delete")
	})

	it("returns 'reassign' when target has different role for same club", () => {
		const targetKeys = new Set(["President|10"])
		expect(classifyCommittee("Treasurer", 10, targetKeys)).toBe("reassign")
	})

	it("returns 'reassign' when target has same role but different club", () => {
		const targetKeys = new Set(["President|10"])
		expect(classifyCommittee("President", 20, targetKeys)).toBe("reassign")
	})

	it("returns 'reassign' when target has no committees", () => {
		const targetKeys = new Set<string>()
		expect(classifyCommittee("President", 10, targetKeys)).toBe("reassign")
	})
})
