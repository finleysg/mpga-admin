"use client";

import { ContactForm } from "../contact-form";

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 font-heading text-3xl font-bold text-secondary-500">
        New Contact
      </h1>
      <ContactForm />
    </div>
  );
}
