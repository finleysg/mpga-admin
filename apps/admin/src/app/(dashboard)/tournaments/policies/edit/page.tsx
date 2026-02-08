import { H1 } from "@mpga/ui";

import { ContentEditor } from "@/components/content-editor";

export default function EditPoliciesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <H1 variant="secondary" className="mb-6">
        Edit Tournament Policies
      </H1>
      <ContentEditor contentType="TP" backHref="/tournaments/policies" />
    </div>
  );
}
