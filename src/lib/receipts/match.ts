import type {
  ReceiptMatchCandidate,
  ReceiptRow,
  ReceiptAttachedTransaction,
} from "@/lib/receipts/types";
import type { ReceiptPaymentMethod } from "@/types/database";

const AMOUNT_EXACT_POINTS = 50;
const AMOUNT_CLOSE_POINTS = 25;
const MERCHANT_EXACT_POINTS = 30;
const MERCHANT_PARTIAL_POINTS = 15;
const DATE_SAME_POINTS = 20;
const DATE_CLOSE_POINTS = 10;
const DATE_NEAR_POINTS = 5;
const PAYMENT_MATCH_POINTS = 15;

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dateA = new Date(`${a}T12:00:00`).getTime();
  const dateB = new Date(`${b}T12:00:00`).getTime();
  return Math.round(Math.abs(dateA - dateB) / msPerDay);
}

function paymentMethodMatchesAccount(
  paymentMethod: ReceiptPaymentMethod | null | undefined,
  accountType: string | null | undefined
): boolean {
  if (!paymentMethod || !accountType) return false;

  if (paymentMethod === "cash") {
    return accountType === "cash";
  }

  if (paymentMethod === "card" || paymentMethod === "contactless") {
    return (
      accountType === "credit_card" ||
      accountType === "current" ||
      accountType === "other"
    );
  }

  return false;
}

export function scoreTransactionForReceipt(
  receipt: Pick<
    ReceiptRow,
    "merchant_name" | "receipt_date" | "total_amount" | "payment_method"
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

  if (
    receipt.payment_method &&
    paymentMethodMatchesAccount(
      receipt.payment_method,
      transaction.account?.account_type
    )
  ) {
    score += PAYMENT_MATCH_POINTS;
    reasons.push("Payment method matches account");
  }

  return { score, reasons };
}

const CARD_ACCOUNT_TYPES = new Set([
  "credit_card",
  "current",
  "other",
]);

function paymentMatchBoost(
  paymentMethod: ReceiptPaymentMethod | null | undefined,
  accountType: string | null | undefined
): { delta: number; reason?: string } {
  if (!paymentMethod || paymentMethod === "unknown") {
    return { delta: 0 };
  }

  if (paymentMethod === "cash") {
    if (accountType === "cash") {
      return { delta: 20, reason: "Cash account" };
    }
    if (accountType && CARD_ACCOUNT_TYPES.has(accountType)) {
      return { delta: -25 };
    }
    return { delta: 0 };
  }

  if (
    paymentMethod === "card" ||
    paymentMethod === "contactless"
  ) {
    if (accountType && CARD_ACCOUNT_TYPES.has(accountType)) {
      return { delta: 20, reason: "Card account" };
    }
    if (accountType === "cash") {
      return { delta: -15 };
    }
  }

  return { delta: 0 };
}

export function rankTransactionMatches(
  receipt: Pick<
    ReceiptRow,
    "merchant_name" | "receipt_date" | "total_amount" | "payment_method"
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
      const boost = paymentMatchBoost(
        receipt.payment_method,
        transaction.account?.account_type
      );
      const reasonsWithBoost = boost.reason
        ? [...reasons, boost.reason]
        : reasons;
      return {
        transaction,
        score: score + boost.delta,
        reasons: reasonsWithBoost,
      };
    })
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}
