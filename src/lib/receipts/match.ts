import type {
  ReceiptMatchCandidate,
  ReceiptMatchDebug,
  ReceiptRow,
  ReceiptAttachedTransaction,
  MatchConfidence,
} from "@/lib/receipts/types";
import type { ReceiptPaymentMethod } from "@/types/database";

const CONFIDENCE_RANK: Record<MatchConfidence, number> = {
  strong: 4,
  medium: 3,
  weak: 2,
  none: 0,
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dateA = new Date(`${a}T12:00:00`).getTime();
  const dateB = new Date(`${b}T12:00:00`).getTime();
  return Math.round(Math.abs(dateA - dateB) / msPerDay);
}

function amountDiff(
  receiptAmount: number | null,
  txAmount: number
): number | null {
  if (receiptAmount === null || !Number.isFinite(receiptAmount)) {
    return null;
  }
  return Math.abs(Number(receiptAmount) - Number(txAmount));
}

/** Amount is the strongest signal — loose matches must not qualify as confident. */
export function scoreAmountTier(diff: number | null): MatchConfidence | "n/a" {
  if (diff === null) return "n/a";
  if (diff <= 0.01) return "strong";
  if (diff <= 0.05) return "medium";
  if (diff <= 0.5) return "weak";
  return "none";
}

export function scoreDateTier(diff: number | null): MatchConfidence | "n/a" {
  if (diff === null) return "n/a";
  if (diff === 0) return "strong";
  if (diff <= 3) return "medium";
  if (diff <= 7) return "weak";
  return "none";
}

export type MerchantMatchTier =
  | "strong"
  | "medium"
  | "none"
  | "contradictory"
  | "n/a";

export function scoreMerchantTier(
  receiptMerchant: string | null | undefined,
  txMerchant: string | null | undefined,
  txDescription: string | null | undefined
): MerchantMatchTier {
  const receipt = receiptMerchant?.trim() ?? "";
  const tx =
    txMerchant?.trim() || txDescription?.trim() || "";

  if (!receipt || !tx) return "n/a";

  const a = normalizeText(receipt);
  const b = normalizeText(tx);

  if (a.length < 2 || b.length < 2) return "n/a";

  if (a === b) return "strong";

  if (a.includes(b) || b.includes(a)) return "medium";

  const aTokens = new Set(a.split(/\s+/).filter((t) => t.length >= 3));
  const bTokens = new Set(b.split(/\s+/).filter((t) => t.length >= 3));
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  if (shared > 0) return "medium";

  return "contradictory";
}

function tierAtLeast(
  tier: MatchConfidence | MerchantMatchTier | "n/a",
  minimum: MatchConfidence
): boolean {
  if (tier === "n/a" || tier === "contradictory") return false;
  if (tier === "none") return false;
  return CONFIDENCE_RANK[tier] >= CONFIDENCE_RANK[minimum];
}

/** Conservative overall confidence — prefer no match over a wrong one. */
export function resolveMatchConfidence(
  amountTier: MatchConfidence | "n/a",
  dateTier: MatchConfidence | "n/a",
  merchantTier: MerchantMatchTier
): MatchConfidence {
  if (amountTier === "none" || dateTier === "none") {
    return "none";
  }

  if (merchantTier === "contradictory") {
    return "none";
  }

  if (
    amountTier === "strong" &&
    dateTier === "strong" &&
    merchantTier === "strong"
  ) {
    return "strong";
  }

  if (
    tierAtLeast(amountTier, "medium") &&
    tierAtLeast(dateTier, "medium") &&
    tierAtLeast(merchantTier, "medium")
  ) {
    return "medium";
  }

  if (tierAtLeast(amountTier, "weak") && tierAtLeast(dateTier, "weak")) {
    if (merchantTier === "none") {
      return "none";
    }
    if (merchantTier === "n/a") {
      return "weak";
    }
    if (merchantTier === "medium" || merchantTier === "strong") {
      return "weak";
    }
  }

  return "none";
}

function compositeScore(
  amountTier: MatchConfidence | "n/a",
  dateTier: MatchConfidence | "n/a",
  merchantTier: MerchantMatchTier,
  amountDiffValue: number | null
): number {
  let score = 0;
  if (amountTier === "strong") score += 100;
  else if (amountTier === "medium") score += 60;
  else if (amountTier === "weak") score += 20;

  if (dateTier === "strong") score += 40;
  else if (dateTier === "medium") score += 25;
  else if (dateTier === "weak") score += 8;

  if (merchantTier === "strong") score += 50;
  else if (merchantTier === "medium") score += 25;

  if (amountDiffValue !== null) {
    score += Math.max(0, 10 - amountDiffValue * 20);
  }

  return score;
}

function buildReasons(
  amountTier: MatchConfidence | "n/a",
  dateTier: MatchConfidence | "n/a",
  merchantTier: MerchantMatchTier,
  amountDiffValue: number | null,
  dateDiffValue: number | null
): string[] {
  const reasons: string[] = [];

  if (amountTier === "strong") reasons.push("Same amount");
  else if (amountTier === "medium") reasons.push("Amount very close");
  else if (amountTier === "weak" && amountDiffValue !== null) {
    reasons.push(`Amount within £${amountDiffValue.toFixed(2)}`);
  }

  if (dateTier === "strong") reasons.push("Same date");
  else if (dateTier === "medium") reasons.push("Close date");
  else if (dateTier === "weak" && dateDiffValue !== null) {
    reasons.push(`${dateDiffValue} days apart`);
  }

  if (merchantTier === "strong") reasons.push("Merchant matches");
  else if (merchantTier === "medium") reasons.push("Similar merchant");
  else if (merchantTier === "contradictory") {
    reasons.push("Different merchant");
  }

  return reasons;
}

const CARD_ACCOUNT_TYPES = new Set(["credit_card", "current", "other"]);

function paymentSortBoost(
  paymentMethod: ReceiptPaymentMethod | null | undefined,
  accountType: string | null | undefined
): number {
  if (!paymentMethod || paymentMethod === "unknown") return 0;

  if (paymentMethod === "cash") {
    if (accountType === "cash") return 3;
    if (accountType && CARD_ACCOUNT_TYPES.has(accountType)) return -3;
  }

  if (paymentMethod === "card" || paymentMethod === "contactless") {
    if (accountType && CARD_ACCOUNT_TYPES.has(accountType)) return 3;
    if (accountType === "cash") return -2;
  }

  return 0;
}

export function scoreTransactionForReceipt(
  receipt: Pick<
    ReceiptRow,
    "merchant_name" | "receipt_date" | "total_amount" | "payment_method"
  >,
  transaction: ReceiptAttachedTransaction
): ReceiptMatchCandidate {
  const receiptAmount =
    receipt.total_amount !== null ? Number(receipt.total_amount) : null;
  const amountDiffValue = amountDiff(receiptAmount, Number(transaction.amount));
  const amountTier = scoreAmountTier(amountDiffValue);

  const dateDiffValue = receipt.receipt_date
    ? daysBetween(receipt.receipt_date, transaction.transaction_date)
    : null;
  const dateTier = scoreDateTier(dateDiffValue);

  const merchantTier = scoreMerchantTier(
    receipt.merchant_name,
    transaction.merchant_name,
    transaction.description
  );

  const confidence = resolveMatchConfidence(
    amountTier,
    dateTier,
    merchantTier
  );

  const debug: ReceiptMatchDebug = {
    amountDiff: amountDiffValue,
    amountTier,
    dateDiff: dateDiffValue,
    dateTier,
    merchantTier,
    finalConfidence: confidence,
    compositeScore: compositeScore(
      amountTier,
      dateTier,
      merchantTier,
      amountDiffValue
    ),
  };

  debug.compositeScore += paymentSortBoost(
    receipt.payment_method,
    transaction.account?.account_type
  );

  const reasons = buildReasons(
    amountTier,
    dateTier,
    merchantTier,
    amountDiffValue,
    dateDiffValue
  );

  return {
    transaction,
    confidence,
    score: debug.compositeScore,
    reasons,
    debug,
  };
}

export interface RankedReceiptMatches {
  /** Strong or medium only — for “Possible match found”. */
  suggestedMatch: ReceiptMatchCandidate | null;
  /** Top weak match — for “Closest transaction” with warning. */
  closestMatch: ReceiptMatchCandidate | null;
  /** Confident + weak matches for manual review (excludes none). */
  candidates: ReceiptMatchCandidate[];
}

export function rankTransactionMatches(
  receipt: Pick<
    ReceiptRow,
    "merchant_name" | "receipt_date" | "total_amount" | "payment_method"
  >,
  transactions: ReceiptAttachedTransaction[],
  options?: { limit?: number }
): RankedReceiptMatches {
  const limit = options?.limit ?? 12;

  const scored = transactions
    .map((transaction) => scoreTransactionForReceipt(receipt, transaction))
    .filter((item) => item.confidence !== "none")
    .sort((a, b) => {
      const confDiff =
        CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
      if (confDiff !== 0) return confDiff;
      return b.score - a.score;
    });

  const suggestedMatch =
    scored.find(
      (item) => item.confidence === "strong" || item.confidence === "medium"
    ) ?? null;

  const closestMatch = scored.find((item) => item.confidence === "weak") ?? null;

  return {
    suggestedMatch,
    closestMatch,
    candidates: scored.slice(0, limit),
  };
}

/** Development regression: Tesco receipt must not be a confident match to Uber Eats. */
export function assertConservativeReceiptMatching(): void {
  const receipt = {
    merchant_name: "Tesco",
    receipt_date: "2026-05-22",
    total_amount: 7.56,
    payment_method: null as ReceiptPaymentMethod | null,
  };

  const uber = scoreTransactionForReceipt(receipt, {
    id: "tx-uber",
    transaction_date: "2026-05-15",
    description: "Uber Eats",
    merchant_name: "Uber Eats",
    amount: 8.06,
    direction: "expense",
    is_business: false,
    receipt_id: null,
    account: { id: "a1", name: "Card", account_type: "credit_card" },
  });

  if (uber.confidence === "strong" || uber.confidence === "medium") {
    throw new Error(
      `Tesco £7.56 should not confidently match Uber Eats £8.06 (got ${uber.confidence})`
    );
  }

  const exact = scoreTransactionForReceipt(receipt, {
    id: "tx-tesco",
    transaction_date: "2026-05-22",
    description: "TESCO",
    merchant_name: "Tesco",
    amount: 7.56,
    direction: "expense",
    is_business: false,
    receipt_id: null,
    account: { id: "a2", name: "Card", account_type: "credit_card" },
  });

  if (exact.confidence !== "strong") {
    throw new Error(
      `Same Tesco transaction should be strong match (got ${exact.confidence})`
    );
  }
}
