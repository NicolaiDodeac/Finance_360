import type { ReceiptPaymentMethod } from "@/types/database";

export interface ReceiptOcrExtraction {
  merchant: string | null;
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
  receiptDate: null,
  totalAmount: null,
  vatAmount: null,
  paymentMethod: null,
  rawText: null,
  confidence: "low",
  fieldsFound: [],
};
