import type { ImportAdapterId, ImportFileType } from "@/lib/import/types";

const PDF_MIME_TYPES = new Set(["application/pdf"]);
const CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
]);

export function detectFileType(
  fileName: string,
  mimeType?: string | null
): ImportFileType | null {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf") || (mimeType && PDF_MIME_TYPES.has(mimeType))) {
    return "pdf";
  }

  if (
    lower.endsWith(".csv") ||
    (mimeType && CSV_MIME_TYPES.has(mimeType))
  ) {
    return "csv";
  }

  return null;
}

export function isLloydsStatementText(text: string): boolean {
  return /lloyds\s+bank/i.test(text) && /your\s+transactions/i.test(text);
}

export function detectPdfAdapter(text: string): ImportAdapterId {
  if (isLloydsStatementText(text)) {
    return "lloyds-pdf";
  }
  return "lloyds-pdf";
}

export function detectCsvAdapter(): ImportAdapterId {
  return "generic-csv";
}
