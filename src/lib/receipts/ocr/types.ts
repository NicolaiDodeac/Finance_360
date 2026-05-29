import type { ReceiptPaymentMethod } from "@/types/database";

import type { MerchantExtractSource } from "@/lib/receipts/ocr/extract-merchant";

/** Per-field confidence (how sure we are about each extracted value). */
export type FieldConfidence = "high" | "medium" | "low";

/** Overall review routing for a captured receipt. */
export type ReceiptReviewLevel = "high" | "medium" | "needs_review";

export interface ReceiptFieldConfidence {
  merchant: FieldConfidence;
  date: FieldConfidence;
  total: FieldConfidence;
  payment: FieldConfidence;
  vat: FieldConfidence;
}

export interface ReceiptOcrExtraction {
  merchant: string | null;
  /** How the merchant name was chosen (audit). */
  merchantSource: MerchantExtractSource;
  knownMerchantId: string | null;
  receiptDate: string | null;
  /** True when no date was read and we fell back to the upload/today date. */
  dateIsFallback?: boolean;
  totalAmount: number | null;
  vatAmount: number | null;
  paymentMethod: ReceiptPaymentMethod | null;
  rawText: string | null;
  /** Legacy coarse confidence (kept for backward compatibility). */
  confidence: "high" | "medium" | "low";
  fieldsFound: string[];
  /** Per-field confidence. */
  fieldConfidence: ReceiptFieldConfidence;
  /** Overall review routing — drives the fast review modes. */
  reviewLevel: ReceiptReviewLevel;
}

export const EMPTY_FIELD_CONFIDENCE: ReceiptFieldConfidence = {
  merchant: "low",
  date: "low",
  total: "low",
  payment: "low",
  vat: "low",
};

export const EMPTY_RECEIPT_EXTRACTION: ReceiptOcrExtraction = {
  merchant: null,
  merchantSource: "unknown",
  knownMerchantId: null,
  receiptDate: null,
  dateIsFallback: false,
  totalAmount: null,
  vatAmount: null,
  paymentMethod: null,
  rawText: null,
  confidence: "low",
  fieldsFound: [],
  fieldConfidence: EMPTY_FIELD_CONFIDENCE,
  reviewLevel: "needs_review",
};
