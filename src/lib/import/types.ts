import type { TransactionDirection } from "@/types/database";

export type ImportFileType = "pdf" | "csv";

export type ImportAdapterId = "lloyds-pdf" | "generic-csv";

export interface NormalizedImportTransaction {
  date: string;
  description: string;
  merchant_name: string | null;
  amount: number;
  direction: TransactionDirection;
  balance: number | null;
  raw_import_data: Record<string, unknown>;
  /** Stable key for in-file deduplication. */
  import_key: string;
  category_id?: string | null;
  hmrc_category_id?: string | null;
  is_business?: boolean;
  matched_rule_id?: string | null;
  matched_rule_name?: string | null;
}

export interface ParseImportFileResult {
  adapterId: ImportAdapterId;
  adapterLabel: string;
  fileType: ImportFileType;
  fileName: string;
  transactions: NormalizedImportTransaction[];
  warnings: string[];
}

export type ImportPreviewStatus =
  | "new"
  | "duplicate"
  | "duplicate_in_file"
  | "skipped";

export interface ImportPreviewRow extends NormalizedImportTransaction {
  preview_id: string;
  status: ImportPreviewStatus;
  existing_transaction_id?: string;
}

export interface ImportTransactionsInput {
  account_id: string;
  adapter_id: ImportAdapterId;
  file_name: string;
  rows: Array<{
    import_key: string;
    date: string;
    description: string;
    merchant_name: string | null;
    amount: number;
    direction: TransactionDirection;
    balance: number | null;
    raw_import_data: Record<string, unknown>;
    category_id?: string | null;
    hmrc_category_id?: string | null;
    is_business?: boolean;
  }>;
}

export interface ImportTransactionsResult {
  imported: number;
  skipped_duplicates: number;
  skipped_invalid: number;
}
