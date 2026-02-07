"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mpga/ui";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type ContactData, listContactsAction } from "./actions";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const result = await listContactsAction();
        if (result.success && result.data) {
          setContacts(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []);

  const formatCityState = (city: string | null, state: string | null) => {
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return "-";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-secondary-500">
          Contacts
        </h1>
        <Button onClick={() => router.push("/members/contacts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No contacts found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City/State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/members/contacts/${contact.id}`)}
                >
                  <TableCell className="font-medium">
                    {contact.lastName}, {contact.firstName}
                  </TableCell>
                  <TableCell>{contact.email ?? "-"}</TableCell>
                  <TableCell>{contact.primaryPhone ?? "-"}</TableCell>
                  <TableCell>
                    {formatCityState(contact.city, contact.state)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
