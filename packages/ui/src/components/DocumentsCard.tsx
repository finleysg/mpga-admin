import { FileText, Download } from "lucide-react";

import { CollapsibleList } from "./CollapsibleList";
import { H2 } from "./ui/heading";

export interface DocumentItem {
  id: number;
  title: string;
  fileUrl: string;
}

export interface DocumentsCardProps {
  documents: DocumentItem[];
  title?: string;
  maxItems?: number;
}

export function DocumentsCard({
  documents,
  title = "Documents",
  maxItems,
}: DocumentsCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <H2 className="mb-4 text-lg">{title}</H2>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents available.</p>
      ) : (
        <div className="space-y-3">
          <CollapsibleList maxItems={maxItems}>
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-50"
              >
                <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="flex-1 text-sm text-gray-700">
                  {doc.title}
                </span>
                <Download className="h-4 w-4 shrink-0 text-secondary-600" />
              </a>
            ))}
          </CollapsibleList>
        </div>
      )}
    </div>
  );
}
