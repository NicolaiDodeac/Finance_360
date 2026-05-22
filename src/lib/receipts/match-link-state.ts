import type { ReceiptAttachedTransaction } from "@/lib/receipts/types";

export interface LinkedReceiptSummary {
  id: string;
  merchant_name: string | null;
  original_filename: string | null;
  total_amount: number | null;
  receipt_date: string | null;
}

export type ReceiptMatchLinkState =
  | "unlinked"
  | "linked_to_this_receipt"
  | "linked_to_other_receipt";

export function linkedReceiptFromTransaction(
  transaction: ReceiptAttachedTransaction
): LinkedReceiptSummary | null {
  const r = transaction.linked_receipt;
  if (!r?.id) return null;
  return {
    id: r.id,
    merchant_name: r.merchant_name,
    original_filename: r.original_filename,
    total_amount:
      r.total_amount !== null && r.total_amount !== undefined
        ? Number(r.total_amount)
        : null,
    receipt_date: r.receipt_date,
  };
}

export function resolveMatchLinkState(
  currentReceiptId: string,
  transaction: ReceiptAttachedTransaction
): {
  linkState: ReceiptMatchLinkState;
  linkedReceipt: LinkedReceiptSummary | null;
} {
  const linked = linkedReceiptFromTransaction(transaction);
  if (!transaction.receipt_id || !linked) {
    return { linkState: "unlinked", linkedReceipt: null };
  }
  if (transaction.receipt_id === currentReceiptId) {
    return { linkState: "linked_to_this_receipt", linkedReceipt: linked };
  }
  return { linkState: "linked_to_other_receipt", linkedReceipt: linked };
}

export function linkedReceiptDisplayLabel(
  linked: LinkedReceiptSummary
): string {
  const name =
    linked.merchant_name?.trim() ||
    linked.original_filename?.trim() ||
    "Saved proof";
  const amount =
    linked.total_amount !== null
      ? ` · £${Number(linked.total_amount).toFixed(2)}`
      : "";
  return `${name}${amount}`;
}
