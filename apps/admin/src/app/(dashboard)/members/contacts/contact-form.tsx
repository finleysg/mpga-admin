"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@mpga/ui";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type ContactData,
  deleteContactAction,
  saveContactAction,
} from "./actions";

interface ContactFormProps {
  contact?: ContactData;
}

export function ContactForm({ contact }: ContactFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [lastName, setLastName] = useState(contact?.lastName ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [primaryPhone, setPrimaryPhone] = useState(contact?.primaryPhone ?? "");
  const [alternatePhone, setAlternatePhone] = useState(
    contact?.alternatePhone ?? "",
  );
  const [addressText, setAddressText] = useState(contact?.addressText ?? "");
  const [city, setCity] = useState(contact?.city ?? "");
  const [state, setState] = useState(contact?.state ?? "");
  const [zip, setZip] = useState(contact?.zip ?? "");
  const [sendEmail, setSendEmail] = useState(contact?.sendEmail ?? true);
  const [notes, setNotes] = useState(contact?.notes ?? "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await saveContactAction({
        id: contact?.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        primaryPhone: primaryPhone.trim() || null,
        alternatePhone: alternatePhone.trim() || null,
        addressText: addressText.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
        sendEmail,
        notes: notes.trim() || null,
      });

      if (result.success) {
        router.push("/members/contacts");
      } else {
        setError(result.error ?? "Failed to save contact");
      }
    } catch (err) {
      console.error("Failed to save contact:", err);
      setError("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/members/contacts");
  };

  const handleDelete = async () => {
    if (!contact?.id) return;

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteContactAction(contact.id);

      if (result.success) {
        router.push("/members/contacts");
      } else {
        setDeleteDialogOpen(false);
        setError(result.error ?? "Failed to delete contact");
      }
    } catch (err) {
      console.error("Failed to delete contact:", err);
      setDeleteDialogOpen(false);
      setError("Failed to delete contact");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Row 1: First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Row 3: Primary Phone and Alternate Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryPhone">Primary Phone</Label>
              <Input
                id="primaryPhone"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alternatePhone">Alternate Phone</Label>
              <Input
                id="alternatePhone"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Address */}
          <div className="space-y-2">
            <Label htmlFor="addressText">Address</Label>
            <Input
              id="addressText"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
            />
          </div>

          {/* Row 5: City, State, Zip */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Send Email checkbox */}
          <div className="flex items-center space-x-2">
            <input
              id="sendEmail"
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <Label htmlFor="sendEmail">Send Email</Label>
          </div>

          {/* Row 7: Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Action buttons */}
          <div className="flex justify-between pt-4">
            {/* Delete button - only shown when editing */}
            {contact && (
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {contact.firstName}{" "}
                      {contact.lastName}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Spacer when no delete button */}
            {!contact && <div />}

            {/* Save/Cancel buttons on the right */}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
