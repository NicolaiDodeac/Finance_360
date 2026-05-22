import type { ReceiptPaymentMethod } from "@/types/database";

import type { MerchantExtractSource } from "@/lib/receipts/ocr/extract-merchant";

export interface ReceiptOcrExtraction {
  merchant: string | null;
  /** How the merchant name was chosen (audit). */
  merchantSource: MerchantExtractSource;
  knownMerchantId: string | null;
  receiptDate: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  paymentMethod: ReceiptPaymentMethod | null;
  rawText: string | null;
  confidence: "high" | "medium" | "low";
  fieldsFound: string[];
}

export const EMPTY_RECEIPT_EXTRACTION: ReceiptOcrExtraction = {
  merchant: null,
  merchantSource: "unknown",
  knownMerchantId: null,
  receiptDate: null,
  totalAmount: null,
  vatAmount: null,
  paymentMethod: null,
  rawText: null,
  confidence: "low",
  fieldsFound: [],
};
