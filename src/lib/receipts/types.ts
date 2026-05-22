import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import type { Database, ReceiptPaymentMethod } from "@/types/database";

export type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
export type { ReceiptPaymentMethod };

export interface ReceiptAttachedTransaction {
  id: string;
  transaction_date: string;
  description: string | null;
  merchant_name: string | null;
  amount: number;
  direction: string;
  is_business: boolean;
  receipt_id: string | null;
  account: {
    id: string;
    name: string;
    account_type: string;
  } | null;
}

export type ReceiptTransactionKind =
  | "cash_expense"
  | "card_manual_expense"
  | "cash_income"
  | "business_income";

export interface CreateTransactionFromReceiptInput {
  kind: ReceiptTransactionKind;
  category_id?: string | null;
  hmrc_category_id?: string | null;
  is_business?: boolean;
  business_use_percent?: number | null;
  notes?: string;
}

export interface ReceiptCaptureReviewData {
  receipt: ReceiptWithRelations;
  extraction: ReceiptOcrExtraction;
  suggestedMatch: ReceiptMatchCandidate | null;
  candidates: ReceiptMatchCandidate[];
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
  payment_method: ReceiptPaymentMethod | null;
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
