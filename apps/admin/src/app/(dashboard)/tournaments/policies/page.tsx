import { Button, Markdown } from "@mpga/ui";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";

import { getContentAction } from "./actions";

export default async function PoliciesPage() {
  const result = await getContentAction("TP");
  const content = result.data;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-secondary-500">
          Tournament Policies
        </h1>
        <Button asChild>
          <Link href="/tournaments/policies/edit">
            {content ? (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </>
            )}
          </Link>
        </Button>
      </div>
      {content ? (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-heading mb-4 text-xl font-semibold">
            {content.title}
          </h2>
          <Markdown content={content.contentText} />
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-6">
          <p className="text-gray-500">
            No tournament policies have been created yet.
          </p>
        </div>
      )}
    </div>
  );
}
