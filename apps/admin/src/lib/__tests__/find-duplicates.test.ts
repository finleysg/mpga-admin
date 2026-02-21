import { describe, expect, it } from "vitest"

import type { ContactData } from "@/app/(dashboard)/members/contacts/actions"

import { findDuplicateGroups } from "../find-duplicates"

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

describe("findDuplicateGroups", () => {
	it("returns no groups when all contacts are unique", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "Alice", lastName: "Smith" }),
			makeContact({ id: 2, firstName: "Bob", lastName: "Jones" }),
		]
		expect(findDuplicateGroups(contacts)).toEqual([])
	})

	it("returns no groups for a single contact", () => {
		const contacts = [makeContact({ id: 1, firstName: "Alice", lastName: "Smith" })]
		expect(findDuplicateGroups(contacts)).toEqual([])
	})

	it("returns no groups for an empty list", () => {
		expect(findDuplicateGroups([])).toEqual([])
	})

	it("groups two contacts with the exact same name as LOW confidence", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Doe" }),
			makeContact({ id: 2, firstName: "John", lastName: "Doe" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
		expect(groups[0]!.confidence).toBe("LOW")
		expect(groups[0]!.contacts).toHaveLength(2)
	})

	it("groups contacts with same email and shared last name as HIGH confidence", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Doe", email: "jd@example.com" }),
			makeContact({ id: 2, firstName: "Jane", lastName: "Doe", email: "jd@example.com" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
		expect(groups[0]!.confidence).toBe("HIGH")
		expect(groups[0]!.matchReason).toContain("Email")
	})

	it("groups contacts with same email and shared first name as HIGH confidence", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Smith", email: "john@example.com" }),
			makeContact({ id: 2, firstName: "John", lastName: "Doe", email: "john@example.com" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
		expect(groups[0]!.confidence).toBe("HIGH")
	})

	it("does NOT group contacts with same email but no shared name part", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "Alice", lastName: "Smith", email: "shared@example.com" }),
			makeContact({ id: 2, firstName: "Bob", lastName: "Jones", email: "shared@example.com" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toEqual([])
	})

	it("groups contacts with same phone and shared last name as HIGH confidence", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Smith", primaryPhone: "612-555-1234" }),
			makeContact({ id: 2, firstName: "Jane", lastName: "Smith", primaryPhone: "612-555-1234" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
		expect(groups[0]!.confidence).toBe("HIGH")
		expect(groups[0]!.matchReason).toContain("Phone")
	})

	it("does NOT group contacts with same phone but no shared name part", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "Alice", lastName: "Smith", primaryPhone: "612-555-1234" }),
			makeContact({ id: 2, firstName: "Bob", lastName: "Jones", primaryPhone: "612-555-1234" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toEqual([])
	})

	it("normalizes phone numbers (strips non-digit chars)", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Smith", primaryPhone: "(612) 555-1234" }),
			makeContact({ id: 2, firstName: "Jane", lastName: "Smith", primaryPhone: "6125551234" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
		expect(groups[0]!.confidence).toBe("HIGH")
	})

	it("matches alternate phone against primary phone", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Smith", primaryPhone: "612-555-1234" }),
			makeContact({ id: 2, firstName: "Jane", lastName: "Smith", alternatePhone: "612-555-1234" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
	})

	it("handles transitive grouping: A↔B by name, B↔C by email", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Doe" }),
			makeContact({ id: 2, firstName: "John", lastName: "Doe", email: "john@example.com" }),
			makeContact({ id: 3, firstName: "John", lastName: "Smith", email: "john@example.com" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
		expect(groups[0]!.contacts).toHaveLength(3)
		expect(groups[0]!.confidence).toBe("HIGH")
	})

	it("name matching is case-insensitive", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "JOHN", lastName: "DOE" }),
			makeContact({ id: 2, firstName: "john", lastName: "doe" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
	})

	it("email matching is case-insensitive", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "John", lastName: "Doe", email: "JD@Example.COM" }),
			makeContact({ id: 2, firstName: "Jane", lastName: "Doe", email: "jd@example.com" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(1)
	})

	it("sorts HIGH confidence groups before LOW", () => {
		const contacts = [
			// LOW group (name only)
			makeContact({ id: 1, firstName: "Alice", lastName: "Brown" }),
			makeContact({ id: 2, firstName: "Alice", lastName: "Brown" }),
			// HIGH group (email + shared name)
			makeContact({ id: 3, firstName: "Bob", lastName: "White", email: "bob@test.com" }),
			makeContact({ id: 4, firstName: "Bobby", lastName: "White", email: "bob@test.com" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(2)
		expect(groups[0]!.confidence).toBe("HIGH")
		expect(groups[1]!.confidence).toBe("LOW")
	})

	it("within same confidence, sorts by group size descending", () => {
		const contacts = [
			// Small group
			makeContact({ id: 1, firstName: "Alice", lastName: "Brown" }),
			makeContact({ id: 2, firstName: "Alice", lastName: "Brown" }),
			// Large group
			makeContact({ id: 3, firstName: "Bob", lastName: "White" }),
			makeContact({ id: 4, firstName: "Bob", lastName: "White" }),
			makeContact({ id: 5, firstName: "Bob", lastName: "White" }),
		]
		const groups = findDuplicateGroups(contacts)
		expect(groups).toHaveLength(2)
		expect(groups[0]!.contacts).toHaveLength(3)
		expect(groups[1]!.contacts).toHaveLength(2)
	})

	it("ignores empty/null emails and phones", () => {
		const contacts = [
			makeContact({ id: 1, firstName: "Alice", lastName: "Smith", email: "", primaryPhone: null }),
			makeContact({ id: 2, firstName: "Bob", lastName: "Jones", email: null, primaryPhone: "" }),
		]
		expect(findDuplicateGroups(contacts)).toEqual([])
	})
})
