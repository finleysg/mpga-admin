import { getMediaUrl } from "@mpga/types";
import { DocumentsCard, MatchPlayResultsTable } from "@mpga/ui";

import {
  getMatchPlayDocuments,
  getMatchPlayResults,
} from "@/lib/queries/match-play";
import { getCurrentSeason } from "@/lib/season";

export default async function MatchPlayResultsPage() {
  const year = getCurrentSeason();
  const [documents, results] = await Promise.all([
    getMatchPlayDocuments(year),
    getMatchPlayResults(year),
  ]);

  const documentItems = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    fileUrl: getMediaUrl(doc.file) ?? "",
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold font-heading text-primary-900">
        Schedule and Results
      </h1>

      {documentItems.length > 0 && (
        <div className="mb-8">
          <DocumentsCard documents={documentItems} title="Downloads" />
        </div>
      )}

      <section>
        {/* <h2 className="mb-4 text-xl font-bold font-heading text-primary-900">
          {year} Results
        </h2> */}
        <MatchPlayResultsTable results={results} />
      </section>
    </main>
  );
}
