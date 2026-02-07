"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mpga/ui";

import type { DuplicateGroup } from "../actions";

interface DuplicateCardProps {
  group: DuplicateGroup;
  onDeduplicate: (group: DuplicateGroup) => void;
}

export function DuplicateCard({ group, onDeduplicate }: DuplicateCardProps) {
  const names = group.contacts
    .map((c) => `${c.firstName} ${c.lastName}`)
    .join(", ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">{names}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {group.contacts.length} contacts
          </p>
        </div>
        <Badge variant={group.confidence === "HIGH" ? "warning" : "outline"}>
          {group.confidence === "HIGH" ? "Likely" : "Possible"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDeduplicate(group)}
          >
            Deduplicate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
