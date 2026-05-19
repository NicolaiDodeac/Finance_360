export {
  evaluateManyTransactions,
  evaluateTransactionEvidence,
  countEvidenceLevels,
  toEvidenceInput,
} from "@/lib/evidence/evaluate";
export {
  buildMerchantFrequency,
  isMerchantClear,
  isRecurringMerchant,
  isRecurringTransaction,
  shouldEvaluateEvidence,
  isBusinessExpense,
  normalizeMerchantKey,
} from "@/lib/evidence/rules";
export {
  getEvidenceLevelLabel,
  buildEvidenceSummary,
  formatEvidenceCount,
  EVIDENCE_EXPLAINER_SECTIONS,
} from "@/lib/evidence/labels";
export type {
  EvidenceConfidenceLevel,
  EvidenceConfidenceCounts,
  EvidenceEvaluation,
  EvidenceEvaluationContext,
  EvidenceFactorId,
  EvidenceFactorResult,
  EvidenceTransactionInput,
} from "@/lib/evidence/types";
