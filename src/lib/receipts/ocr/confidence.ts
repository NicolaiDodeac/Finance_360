import type { MerchantExtractSource } from "@/lib/receipts/ocr/extract-merchant";
import type {
  FieldConfidence,
  ReceiptFieldConfidence,
  ReceiptReviewLevel,
} from "@/lib/receipts/ocr/types";
import type { ReceiptPaymentMethod } from "@/types/database";

export interface FieldConfidenceInput {
  merchant: string | null;
  merchantSource: MerchantExtractSource;
  receiptDate: string | null;
  dateIsFallback: boolean;
  totalAmount: number | null;
  /** How the total was found — keyword line is more trustworthy than a guess. */
  totalSource: "keyword" | "largest" | "none";
  paymentMethod: ReceiptPaymentMethod | null;
  vatAmount: number | null;
}

function merchantConfidence(
  merchant: string | null,
  source: MerchantExtractSource
): FieldConfidence {
  if (!merchant) return "low";
  if (source === "known") return "high";
  if (source === "top_line") return "medium";
  return "low";
}

function dateConfidence(
  receiptDate: string | null,
  isFallback: boolean
): FieldConfidence {
  if (!receiptDate) return "low";
  if (isFallback) return "low";
  return "high";
}

function totalConfidence(
  totalAmount: number | null,
  source: FieldConfidenceInput["totalSource"]
): FieldConfidence {
  if (totalAmount === null) return "low";
  if (source === "keyword") return "high";
  if (source === "largest") return "medium";
  return "low";
}

function paymentConfidence(
  paymentMethod: ReceiptPaymentMethod | null
): FieldConfidence {
  if (!paymentMethod || paymentMethod === "unknown") return "low";
  return "high";
}

function vatConfidence(vatAmount: number | null): FieldConfidence {
  return vatAmount === null ? "low" : "high";
}

export function scoreFieldConfidence(
  input: FieldConfidenceInput
): ReceiptFieldConfidence {
  return {
    merchant: merchantConfidence(input.merchant, input.merchantSource),
    date: dateConfidence(input.receiptDate, input.dateIsFallback),
    total: totalConfidence(input.totalAmount, input.totalSource),
    payment: paymentConfidence(input.paymentMethod),
    vat: vatConfidence(input.vatAmount),
  };
}

/**
 * Overall review routing.
 *
 * high         — merchant + total + date all found and trustworthy.
 * medium       — total + date found, but merchant or category uncertain.
 * needs_review — missing total, or no usable merchant/date.
 */
export function resolveReviewLevel(
  fields: ReceiptFieldConfidence,
  input: Pick<
    FieldConfidenceInput,
    "merchant" | "receiptDate" | "totalAmount" | "dateIsFallback"
  >
): ReceiptReviewLevel {
  const hasTotal = input.totalAmount !== null;
  const hasUsableDate = Boolean(input.receiptDate) && !input.dateIsFallback;
  const hasMerchant = Boolean(input.merchant);

  if (!hasTotal || (!hasMerchant && !hasUsableDate)) {
    return "needs_review";
  }

  if (
    hasMerchant &&
    hasUsableDate &&
    fields.total !== "low" &&
    fields.merchant !== "low"
  ) {
    return "high";
  }

  return "medium";
}

/** Legacy coarse confidence so existing consumers keep working. */
export function legacyConfidence(
  reviewLevel: ReceiptReviewLevel
): "high" | "medium" | "low" {
  if (reviewLevel === "high") return "high";
  if (reviewLevel === "medium") return "medium";
  return "low";
}
