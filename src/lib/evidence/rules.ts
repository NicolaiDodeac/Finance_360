import { HIGH_VALUE_EXPENSE_THRESHOLD } from "@/lib/tax/constants";
import type {
  EvidenceFactorId,
  EvidenceFactorResult,
  EvidenceTransactionInput,
} from "@/lib/evidence/types";

/** Minimum occurrences to treat a merchant as recurring */
export const RECURRING_MERCHANT_MIN_COUNT = 3;

/** Days window for similar recurring payments */
export const RECURRING_TRANSACTION_DAYS = 45;

/** Amount tolerance (fraction) when matching recurring payments */
export const RECURRING_AMOUNT_TOLERANCE = 0.05;

/** Score thresholds → confidence level */
export const EVIDENCE_LEVEL_THRESHOLDS = {
  high: 70,
  medium: 45,
  low: 25,
} as const;

const UNCLEAR_MERCHANT_PATTERNS = [
  /^card payment$/i,
  /^contactless$/i,
  /^pos purchase$/i,
  /^debit card$/i,
  /^card purchase$/i,
  /^payment$/i,
  /^transfer$/i,
  /^unknown$/i,
  /^misc$/i,
  /^miscellaneous$/i,
];

export function normalizeMerchantKey(
  tx: Pick<EvidenceTransactionInput, "merchant_name" | "description">
): string | null {
  const raw = tx.merchant_name?.trim() || tx.description?.trim();
  if (!raw) return null;
  return raw.toLowerCase().replace(/\s+/g, " ");
}

export function isMerchantClear(
  tx: Pick<EvidenceTransactionInput, "merchant_name" | "description">
): boolean {
  const key = normalizeMerchantKey(tx);
  if (!key || key.length < 3) return false;
  if (UNCLEAR_MERCHANT_PATTERNS.some((pattern) => pattern.test(key))) {
    return false;
  }
  return true;
}

export function buildMerchantFrequency(
  transactions: EvidenceTransactionInput[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tx of transactions) {
    const key = normalizeMerchantKey(tx);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function isRecurringMerchant(
  tx: EvidenceTransactionInput,
  frequency: Map<string, number>
): boolean {
  const key = normalizeMerchantKey(tx);
  if (!key) return false;
  return (frequency.get(key) ?? 0) >= RECURRING_MERCHANT_MIN_COUNT;
}

export function isRecurringTransaction(
  tx: EvidenceTransactionInput,
  peers: EvidenceTransactionInput[]
): boolean {
  const key = normalizeMerchantKey(tx);
  if (!key) return false;

  const amount = Number(tx.amount);
  const txDate = new Date(tx.transaction_date).getTime();
  if (Number.isNaN(txDate)) return false;

  const windowMs = RECURRING_TRANSACTION_DAYS * 24 * 60 * 60 * 1000;

  let matches = 0;
  for (const other of peers) {
    if (other.id === tx.id) continue;
    if (normalizeMerchantKey(other) !== key) continue;

    const otherDate = new Date(other.transaction_date).getTime();
    if (Number.isNaN(otherDate)) continue;
    if (Math.abs(otherDate - txDate) > windowMs) continue;

    const otherAmount = Number(other.amount);
    const tolerance = Math.max(amount, otherAmount) * RECURRING_AMOUNT_TOLERANCE;
    if (Math.abs(amount - otherAmount) <= tolerance) {
      matches += 1;
    }
  }

  return matches >= 1;
}

export function shouldEvaluateEvidence(tx: EvidenceTransactionInput): boolean {
  return tx.is_business;
}

export function isBusinessExpense(tx: EvidenceTransactionInput): boolean {
  return tx.is_business && tx.direction === "expense";
}

export function isBusinessIncome(tx: EvidenceTransactionInput): boolean {
  return tx.is_business && tx.direction === "income";
}

function factor(
  id: EvidenceFactorId,
  scoreDelta: number,
  phrase: string
): EvidenceFactorResult {
  return { id, scoreDelta, phrase };
}

export function evaluateReceiptAttached(
  tx: EvidenceTransactionInput
): EvidenceFactorResult | null {
  if (!tx.receipt_id) return null;
  return factor("receipt_attached", 40, "Receipt or invoice linked.");
}

export function evaluateAmountSize(
  tx: EvidenceTransactionInput
): EvidenceFactorResult | null {
  if (!isBusinessExpense(tx) || tx.receipt_id) return null;

  const amount = Number(tx.amount);
  if (amount >= HIGH_VALUE_EXPENSE_THRESHOLD * 5) {
    return factor(
      "amount_size",
      -25,
      "High-value expense without additional proof."
    );
  }
  if (amount >= HIGH_VALUE_EXPENSE_THRESHOLD) {
    return factor(
      "amount_size",
      -15,
      "Higher amount — additional proof may help."
    );
  }
  return null;
}

export function evaluateRecurringMerchant(
  tx: EvidenceTransactionInput,
  frequency: Map<string, number>
): EvidenceFactorResult | null {
  if (!isRecurringMerchant(tx, frequency)) return null;
  return factor(
    "recurring_merchant",
    22,
    "Recurring merchant with bank evidence."
  );
}

export function evaluateMerchantClarity(
  tx: EvidenceTransactionInput
): EvidenceFactorResult | null {
  if (isMerchantClear(tx)) {
    return factor("merchant_clarity", 12, "Clear merchant on record.");
  }
  return factor(
    "merchant_clarity",
    -12,
    "Merchant name is unclear — context may help."
  );
}

export function evaluateHmrcCategory(
  tx: EvidenceTransactionInput
): EvidenceFactorResult | null {
  if (!isBusinessExpense(tx)) return null;
  if (tx.hmrc_category_id) {
    return factor("hmrc_category", 14, "HMRC category assigned.");
  }
  return factor(
    "hmrc_category",
    -10,
    "No HMRC category yet — assign one when you can."
  );
}

export function evaluateNotesPresent(
  tx: EvidenceTransactionInput
): EvidenceFactorResult | null {
  if (!tx.notes?.trim()) return null;
  return factor("notes_present", 8, "Notes explain business purpose.");
}

export function evaluateRecurringTransaction(
  tx: EvidenceTransactionInput,
  peers: EvidenceTransactionInput[]
): EvidenceFactorResult | null {
  if (!isRecurringTransaction(tx, peers)) return null;
  return factor(
    "recurring_transaction",
    14,
    "Similar payment seen on your account before."
  );
}

export function evaluateBusinessTransaction(
  tx: EvidenceTransactionInput
): EvidenceFactorResult | null {
  if (!tx.is_business) return null;
  if (isBusinessExpense(tx)) {
    return factor(
      "business_transaction",
      5,
      "Recorded as a business expense."
    );
  }
  if (isBusinessIncome(tx)) {
    return factor(
      "business_transaction",
      5,
      "Recorded as business income."
    );
  }
  return factor("business_transaction", 0, "Business transfer.");
}

export function evaluateBankEvidence(
  tx: EvidenceTransactionInput
): EvidenceFactorResult | null {
  if (!tx.account_id) return null;
  return factor("bank_evidence", 10, "Bank or card record on file.");
}

export function collectEvidenceFactors(
  tx: EvidenceTransactionInput,
  peers: EvidenceTransactionInput[]
): EvidenceFactorResult[] {
  const frequency = buildMerchantFrequency(peers);
  const factors: EvidenceFactorResult[] = [];

  const business = evaluateBusinessTransaction(tx);
  if (business) factors.push(business);

  const receipt = evaluateReceiptAttached(tx);
  if (receipt) factors.push(receipt);

  const amount = evaluateAmountSize(tx);
  if (amount) factors.push(amount);

  const recurringMerchant = evaluateRecurringMerchant(tx, frequency);
  if (recurringMerchant) factors.push(recurringMerchant);

  const merchant = evaluateMerchantClarity(tx);
  if (merchant) factors.push(merchant);

  const hmrc = evaluateHmrcCategory(tx);
  if (hmrc) factors.push(hmrc);

  const notes = evaluateNotesPresent(tx);
  if (notes) factors.push(notes);

  const recurringTx = evaluateRecurringTransaction(tx, peers);
  if (recurringTx) factors.push(recurringTx);

  const bank = evaluateBankEvidence(tx);
  if (bank) factors.push(bank);

  return factors;
}

export function scoreToLevel(
  score: number,
  factors: EvidenceFactorResult[],
  tx: EvidenceTransactionInput
): import("@/lib/evidence/types").EvidenceConfidenceLevel {
  const hasReceipt = Boolean(tx.receipt_id);
  const amountFactor = factors.find((f) => f.id === "amount_size");
  const strongAmountPenalty =
    amountFactor?.scoreDelta != null && amountFactor.scoreDelta <= -20;

  if (
    isBusinessExpense(tx) &&
    !hasReceipt &&
    strongAmountPenalty &&
    score < EVIDENCE_LEVEL_THRESHOLDS.medium
  ) {
    return "review_recommended";
  }

  if (score >= EVIDENCE_LEVEL_THRESHOLDS.high) return "high";
  if (score >= EVIDENCE_LEVEL_THRESHOLDS.medium) return "medium";
  if (score >= EVIDENCE_LEVEL_THRESHOLDS.low) return "low";
  return "review_recommended";
}
