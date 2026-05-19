import { importAdapters } from "@/lib/import/adapters";
import {
  detectCsvAdapter,
  detectFileType,
  detectPdfAdapter,
} from "@/lib/import/detect";
import { extractPdfText } from "@/lib/import/pdf/extract-text";
import type { ParseImportFileResult } from "@/lib/import/types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function parseImportFile(
  fileName: string,
  buffer: Buffer,
  mimeType?: string | null
): Promise<ParseImportFileResult> {
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new Error("File is too large. Maximum size is 10 MB.");
  }

  const fileType = detectFileType(fileName, mimeType);
  if (!fileType) {
    throw new Error("Unsupported file type. Upload a PDF or CSV file.");
  }

  let text: string | undefined;
  if (fileType === "pdf") {
    text = await extractPdfText(buffer);
  }

  const adapterId =
    fileType === "pdf" ? detectPdfAdapter(text ?? "") : detectCsvAdapter();

  const adapter = importAdapters.find((item) => item.id === adapterId);
  if (!adapter) {
    throw new Error("No import adapter available for this file.");
  }

  const context = {
    fileName,
    fileType,
    buffer,
    text,
  };

  if (!adapter.canParse(context)) {
    throw new Error(`${adapter.label} cannot parse this file.`);
  }

  const { transactions, warnings } = await adapter.parse(context);

  return {
    adapterId: adapter.id,
    adapterLabel: adapter.label,
    fileType,
    fileName,
    transactions,
    warnings,
  };
}
