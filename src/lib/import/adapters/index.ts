import { genericCsvAdapter } from "@/lib/import/adapters/generic-csv-parser";
import { lloydsPdfAdapter } from "@/lib/import/adapters/lloyds-pdf-parser";
import type { ImportAdapter } from "@/lib/import/adapters/types";

export const importAdapters: ImportAdapter[] = [lloydsPdfAdapter, genericCsvAdapter];

export function getAdapterById(id: string): ImportAdapter | undefined {
  return importAdapters.find((adapter) => adapter.id === id);
}

export { lloydsPdfAdapter, genericCsvAdapter };
export type { ImportAdapter, ImportParseContext, ImportParseResult } from "@/lib/import/adapters/types";
