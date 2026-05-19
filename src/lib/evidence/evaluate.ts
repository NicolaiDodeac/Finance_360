import {
  collectEvidenceFactors,
  isBusinessExpense,
  scoreToLevel,
  shouldEvaluateEvidence,
} from "@/lib/evidence/rules";
import { buildEvidenceSummary } from "@/lib/evidence/labels";
import type {
  EvidenceConfidenceCounts,
  EvidenceEvaluation,
  EvidenceEvaluationContext,
  EvidenceTransactionInput,
} from "@/lib/evidence/types";

const BASE_BUSINESS_EXPENSE_SCORE = 38;
const BASE_BUSINESS_INCOME_SCORE = 42;
const BASE_BUSINESS_TRANSFER_SCORE = 35;

function baseScoreFor(tx: EvidenceTransactionInput): number {
  if (isBusinessExpense(tx)) return BASE_BUSINESS_EXPENSE_SCORE;
  if (tx.is_business && tx.direction === "income") {
    return BASE_BUSINESS_INCOME_SCORE;
  }
  return BASE_BUSINESS_TRANSFER_SCORE;
}

export function evaluateTransactionEvidence(
  tx: EvidenceTransactionInput,
  context: EvidenceEvaluationContext
): EvidenceEvaluation | null {
  if (!shouldEvaluateEvidence(tx)) return null;

  const peers = context.peerTransactions.filter((p) => p.is_business);
  const factors = collectEvidenceFactors(tx, peers);
  const rawScore = baseScoreFor(tx) + factors.reduce((sum, f) => sum + f.scoreDelta, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const level = scoreToLevel(score, factors, tx);

  return buildEvidenceSummary(level, score, factors);
}

export function evaluateManyTransactions(
  transactions: EvidenceTransactionInput[],
  context?: Partial<EvidenceEvaluationContext>
): Map<string, EvidenceEvaluation> {
  const peers = context?.peerTransactions ?? transactions;
  const results = new Map<string, EvidenceEvaluation>();

  for (const tx of transactions) {
    const evaluation = evaluateTransactionEvidence(tx, { peerTransactions: peers });
    if (evaluation) {
      results.set(tx.id, evaluation);
    }
  }

  return results;
}

export function countEvidenceLevels(
  evaluations: Iterable<EvidenceEvaluation>
): EvidenceConfidenceCounts {
  const counts: EvidenceConfidenceCounts = {
    high: 0,
    medium: 0,
    low: 0,
    reviewRecommended: 0,
    total: 0,
  };

  for (const evaluation of evaluations) {
    counts.total += 1;
    switch (evaluation.level) {
      case "high":
        counts.high += 1;
        break;
      case "medium":
        counts.medium += 1;
        break;
      case "low":
        counts.low += 1;
        break;
      case "review_recommended":
        counts.reviewRecommended += 1;
        break;
    }
  }

  return counts;
}

export function toEvidenceInput(
  tx: EvidenceTransactionInput
): EvidenceTransactionInput {
  return {
    id: tx.id,
    amount: Number(tx.amount),
    direction: tx.direction,
    is_business: tx.is_business,
    hmrc_category_id: tx.hmrc_category_id,
    receipt_id: tx.receipt_id,
    transaction_date: tx.transaction_date,
    description: tx.description,
    merchant_name: tx.merchant_name,
    notes: tx.notes,
    account_id: tx.account_id,
  };
}
