"use client";

import { H1 } from "@mpga/ui";

import { ContactForm } from "../contact-form";

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <H1 variant="secondary" className="mb-6">
        New Contact
      </H1>
      <ContactForm />
    </div>
  );
}
