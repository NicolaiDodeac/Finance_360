import type {
  ImportAdapterId,
  ImportFileType,
  NormalizedImportTransaction,
} from "@/lib/import/types";

export interface ImportParseContext {
  fileName: string;
  fileType: ImportFileType;
  buffer: Buffer;
  text?: string;
}

export interface ImportParseResult {
  transactions: NormalizedImportTransaction[];
  warnings: string[];
}

export interface ImportAdapter {
  id: ImportAdapterId;
  label: string;
  fileTypes: ImportFileType[];
  canParse(context: ImportParseContext): boolean;
  parse(context: ImportParseContext): Promise<ImportParseResult>;
}
