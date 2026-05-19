import type { TaxYearRow } from "@/lib/tax-years/queries";
import type { Database } from "@/types/database";

export type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];

export interface ReceiptAttachedTransaction {
  id: string;
  transaction_date: string;
  description: string | null;
  merchant_name: string | null;
  amount: number;
  direction: string;
  is_business: boolean;
  receipt_id: string | null;
}

export interface ReceiptWithRelations extends ReceiptRow {
  tax_year: Pick<TaxYearRow, "id" | "label"> | null;
  attached_transaction: ReceiptAttachedTransaction | null;
}

export interface ReceiptFormInput {
  merchant_name: string;
  receipt_date: string;
  total_amount: number | null;
  vat_amount: number | null;
  notes: string;
  tax_year_id: string | null;
}

export interface ReceiptMatchCandidate {
  transaction: ReceiptAttachedTransaction;
  score: number;
  reasons: string[];
}

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}
