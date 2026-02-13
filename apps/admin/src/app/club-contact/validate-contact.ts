import { clubContact, contact } from "@mpga/database"
import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db"

export async function validateClubContact(clubId: number, email: string): Promise<boolean> {
	const result = await db
		.select({ id: clubContact.id })
		.from(clubContact)
		.innerJoin(contact, eq(clubContact.contactId, contact.id))
		.where(and(eq(clubContact.clubId, clubId), eq(contact.email, email)))
		.limit(1)

	return result.length > 0
}
