"use server";

import { contact } from "@mpga/database";
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";

interface ContactInput {
  id?: number;
  firstName: string;
  lastName: string;
  primaryPhone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  addressText?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
  sendEmail?: boolean;
}

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

export async function saveContactAction(
  data: ContactInput,
): Promise<ActionResult<{ id: number }>> {
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();

  if (!firstName || !lastName) {
    return { success: false, error: "First name and last name are required" };
  }

  try {
    if (data.id !== undefined) {
      await db
        .update(contact)
        .set({
          firstName,
          lastName,
          primaryPhone: data.primaryPhone ?? null,
          alternatePhone: data.alternatePhone ?? null,
          email: data.email ?? null,
          addressText: data.addressText ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          zip: data.zip ?? null,
          notes: data.notes ?? null,
          sendEmail: data.sendEmail ?? true,
        })
        .where(eq(contact.id, data.id));

      return { success: true, data: { id: data.id } };
    } else {
      const result = await db.insert(contact).values({
        firstName,
        lastName,
        primaryPhone: data.primaryPhone ?? null,
        alternatePhone: data.alternatePhone ?? null,
        email: data.email ?? null,
        addressText: data.addressText ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zip: data.zip ?? null,
        notes: data.notes ?? null,
        sendEmail: data.sendEmail ?? true,
      });

      return { success: true, data: { id: result[0].insertId } };
    }
  } catch (error) {
    console.error("Failed to save contact:", error);
    return { success: false, error: "Failed to save contact" };
  }
}

export async function deleteContactAction(id: number): Promise<ActionResult> {
  try {
    await db.delete(contact).where(eq(contact.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete contact:", error);

    if (
      error instanceof Error &&
      error.message.includes("foreign key constraint")
    ) {
      return {
        success: false,
        error: "Cannot delete: this contact is linked to a club or committee",
      };
    }

    return { success: false, error: "Failed to delete contact" };
  }
}
