"use client";

import {
  Button,
  H4,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  toast,
} from "@mpga/ui";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

import type { ContactData, DuplicateGroup } from "../actions";
import { mergeContactsAction } from "../actions";

interface MergeDrawerProps {
  group: DuplicateGroup;
  onMerged: (groupId: string) => void;
  onClose: () => void;
}

function formatAddress(c: ContactData) {
  const parts = [c.addressText, c.city, c.state, c.zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function DetailSpan({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <span>
      <span className="text-gray-500">{label}:</span> {value}
    </span>
  );
}

function ContactSubCard({
  contact,
  isSelected,
  isStarred,
  onToggle,
  onStar,
}: {
  contact: ContactData;
  isSelected: boolean;
  isStarred: boolean;
  onToggle: () => void;
  onStar: () => void;
}) {
  const address = formatAddress(contact);

  return (
    <div
      className={`cursor-pointer rounded-md border-2 px-3 py-2 transition-colors ${
        isSelected
          ? "border-secondary-500 bg-secondary-50"
          : "border-gray-200 bg-gray-50 opacity-60"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <H4 variant="secondary">
          {contact.firstName} {contact.lastName}
        </H4>
        <button
          type="button"
          className={`rounded p-0.5 transition-colors hover:bg-secondary-100 ${
            isStarred ? "text-secondary-500" : "text-gray-400"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onStar();
          }}
          title={isStarred ? "Merge target" : "Set as merge target"}
        >
          <Star
            className="h-4 w-4"
            fill={isStarred ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0 text-xs">
        <DetailSpan label="Email" value={contact.email} />
        <DetailSpan label="Ph" value={contact.primaryPhone} />
        <DetailSpan label="Alt" value={contact.alternatePhone} />
        {address && <DetailSpan label="Addr" value={address} />}
        {contact.notes && <DetailSpan label="Notes" value={contact.notes} />}
      </div>
    </div>
  );
}

export function MergeDrawer({ group, onMerged, onClose }: MergeDrawerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [starredId, setStarredId] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
    setStarredId(null);
  }, [group]);

  const toggleContact = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (starredId === id) setStarredId(null);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const starContact = (id: number) => {
    setStarredId(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const canMerge =
    starredId !== null && selectedIds.size >= 2 && selectedIds.has(starredId);

  const handleMerge = async () => {
    if (!canMerge || starredId === null) return;
    setMerging(true);
    try {
      const sourceIds = [...selectedIds].filter((id) => id !== starredId);
      const result = await mergeContactsAction(starredId, sourceIds);
      if (result.success) {
        toast.success("Contacts merged successfully");
        onMerged(group.id);
      } else {
        toast.error(result.error ?? "Failed to merge contacts");
      }
    } catch {
      toast.error("Failed to merge contacts");
    } finally {
      setMerging(false);
    }
  };

  return (
    <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="font-heading">Merge Contacts</SheetTitle>
        <SheetDescription>
          Click on the contacts to highlight all the contacts that should be
          merged. Star one of the contact records to serve as the merge target.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-2 py-4">
        {group.contacts.map((c) => (
          <ContactSubCard
            key={c.id}
            contact={c}
            isSelected={selectedIds.has(c.id)}
            isStarred={starredId === c.id}
            onToggle={() => toggleContact(c.id)}
            onStar={() => starContact(c.id)}
          />
        ))}
      </div>
      <SheetFooter>
        <Button variant="secondaryoutline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          disabled={!canMerge || merging}
          onClick={handleMerge}
        >
          {merging ? "Merging..." : `Merge ${selectedIds.size} Contacts`}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}
