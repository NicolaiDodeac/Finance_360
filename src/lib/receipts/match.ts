import type {
  ReceiptMatchCandidate,
  ReceiptRow,
  ReceiptAttachedTransaction,
} from "@/lib/receipts/types";

const AMOUNT_EXACT_POINTS = 50;
const AMOUNT_CLOSE_POINTS = 25;
const MERCHANT_EXACT_POINTS = 30;
const MERCHANT_PARTIAL_POINTS = 15;
const DATE_SAME_POINTS = 20;
const DATE_CLOSE_POINTS = 10;
const DATE_NEAR_POINTS = 5;

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dateA = new Date(`${a}T12:00:00`).getTime();
  const dateB = new Date(`${b}T12:00:00`).getTime();
  return Math.round(Math.abs(dateA - dateB) / msPerDay);
}

export function scoreTransactionForReceipt(
  receipt: Pick<
    ReceiptRow,
    "merchant_name" | "receipt_date" | "total_amount"
  >,
  transaction: ReceiptAttachedTransaction
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (
    receipt.total_amount !== null &&
    Math.abs(Number(receipt.total_amount) - Number(transaction.amount)) < 0.01
  ) {
    score += AMOUNT_EXACT_POINTS;
    reasons.push("Same amount");
  } else if (
    receipt.total_amount !== null &&
    Math.abs(Number(receipt.total_amount) - Number(transaction.amount)) <= 1
  ) {
    score += AMOUNT_CLOSE_POINTS;
    reasons.push("Similar amount");
  }

  const receiptMerchant = receipt.merchant_name?.trim();
  const txMerchant =
    transaction.merchant_name?.trim() ||
    transaction.description?.trim() ||
    "";

  if (receiptMerchant && txMerchant) {
    const a = normalizeText(receiptMerchant);
    const b = normalizeText(txMerchant);

    if (a === b) {
      score += MERCHANT_EXACT_POINTS;
      reasons.push("Merchant matches");
    } else if (a.includes(b) || b.includes(a)) {
      score += MERCHANT_PARTIAL_POINTS;
      reasons.push("Similar merchant");
    }
  }

  if (receipt.receipt_date) {
    const diff = daysBetween(receipt.receipt_date, transaction.transaction_date);
    if (diff === 0) {
      score += DATE_SAME_POINTS;
      reasons.push("Same date");
    } else if (diff <= 3) {
      score += DATE_CLOSE_POINTS;
      reasons.push("Close date");
    } else if (diff <= 7) {
      score += DATE_NEAR_POINTS;
      reasons.push("Nearby date");
    }
  }

  return { score, reasons };
}

export function rankTransactionMatches(
  receipt: Pick<
    ReceiptRow,
    "merchant_name" | "receipt_date" | "total_amount"
  >,
  transactions: ReceiptAttachedTransaction[],
  options?: { minScore?: number; limit?: number }
): ReceiptMatchCandidate[] {
  const minScore = options?.minScore ?? 10;
  const limit = options?.limit ?? 8;

  const ranked = transactions
    .map((transaction) => {
      const { score, reasons } = scoreTransactionForReceipt(
        receipt,
        transaction
      );
      return { transaction, score, reasons };
    })
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}
