"use client";

import { H1 } from "@mpga/ui";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type ContactData, getContactAction } from "../actions";
import { ContactForm } from "../contact-form";

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContact() {
      const id = Number(params.id);
      if (isNaN(id)) {
        router.push("/members/contacts");
        return;
      }

      try {
        const result = await getContactAction(id);
        if (result.success && result.data) {
          setContact(result.data);
        } else {
          router.push("/members/contacts");
        }
      } catch (err) {
        console.error("Failed to fetch contact:", err);
        router.push("/members/contacts");
      } finally {
        setLoading(false);
      }
    }

    fetchContact();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="py-8 text-center text-gray-500">Loading contact...</div>
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <H1 variant="secondary" className="mb-6">
        Edit Contact
      </H1>
      <ContactForm contact={contact} />
    </div>
  );
}
