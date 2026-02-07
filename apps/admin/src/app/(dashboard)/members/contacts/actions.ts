"use server";

import { contact } from "@mpga/database";
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ContactData {
  id: number;
  firstName: string;
  lastName: string;
  primaryPhone: string | null;
  alternatePhone: string | null;
  email: string | null;
  addressText: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  sendEmail: boolean;
}

export async function listContactsAction(): Promise<
  ActionResult<ContactData[]>
> {
  try {
    const results = await db
      .select({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        primaryPhone: contact.primaryPhone,
        alternatePhone: contact.alternatePhone,
        email: contact.email,
        addressText: contact.addressText,
        city: contact.city,
        state: contact.state,
        zip: contact.zip,
        notes: contact.notes,
        sendEmail: contact.sendEmail,
      })
      .from(contact)
      .orderBy(asc(contact.lastName), asc(contact.firstName));

    return { success: true, data: results };
  } catch (error) {
    console.error("Failed to list contacts:", error);
    return { success: false, error: "Failed to list contacts" };
  }
}

export async function getContactAction(
  id: number,
): Promise<ActionResult<ContactData>> {
  try {
    const results = await db
      .select({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        primaryPhone: contact.primaryPhone,
        alternatePhone: contact.alternatePhone,
        email: contact.email,
        addressText: contact.addressText,
        city: contact.city,
        state: contact.state,
        zip: contact.zip,
        notes: contact.notes,
        sendEmail: contact.sendEmail,
      })
      .from(contact)
      .where(eq(contact.id, id));

    if (results.length === 0) {
      return { success: false, error: "Contact not found" };
    }

    return { success: true, data: results[0] };
  } catch (error) {
    console.error("Failed to get contact:", error);
    return { success: false, error: "Failed to get contact" };
  }
}
