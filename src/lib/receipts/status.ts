import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";
import type { ReceiptRow } from "@/lib/receipts/types";
import type { ReceiptStatus } from "@/types/database";

export type { ReceiptStatus };

export function deriveReceiptStatus(
  receipt: Pick<
    ReceiptRow,
    | "merchant_name"
    | "total_amount"
    | "receipt_date"
    | "status"
  > & { attached?: boolean },
  extraction?: ReceiptOcrExtraction | null
): ReceiptStatus {
  if (receipt.attached) return "linked";
  if (receipt.status === "archived") return "archived";
  if (receipt.status === "processing") return "processing";

  const ocrIncomplete =
    !receipt.merchant_name ||
    receipt.total_amount === null ||
    !receipt.receipt_date ||
    extraction?.confidence === "low";

  if (ocrIncomplete) return "needs_review";
  if (receipt.status) return receipt.status as ReceiptStatus;
  return "ready";
}

export function receiptStatusLabel(status: ReceiptStatus): string {
  switch (status) {
    case "processing":
      return "Processing";
    case "needs_review":
      return "Needs review";
    case "ready":
      return "Ready";
    case "linked":
      return "Linked";
    case "archived":
      return "Archived";
  }
}
