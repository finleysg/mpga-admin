import { ContentEditor } from "@/components/content-editor";

export default function EditPoliciesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 font-heading text-3xl font-bold text-secondary-500">
        Edit Tournament Policies
      </h1>
      <ContentEditor contentType="TP" backHref="/tournaments/policies" />
    </div>
  );
}
