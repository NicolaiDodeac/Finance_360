export type EvidenceConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "review_recommended";

export type EvidenceFactorId =
  | "receipt_attached"
  | "amount_size"
  | "recurring_merchant"
  | "merchant_clarity"
  | "hmrc_category"
  | "notes_present"
  | "recurring_transaction"
  | "business_transaction"
  | "bank_evidence";

export interface EvidenceFactorResult {
  id: EvidenceFactorId;
  /** Signed contribution toward confidence score */
  scoreDelta: number;
  /** Short phrase used in explanations */
  phrase: string;
}

export interface EvidenceTransactionInput {
  id: string;
  amount: number;
  direction: "income" | "expense" | "transfer";
  is_business: boolean;
  hmrc_category_id: string | null;
  receipt_id: string | null;
  transaction_date: string;
  description: string | null;
  merchant_name: string | null;
  notes: string | null;
  account_id?: string | null;
}

export interface EvidenceEvaluationContext {
  /** Peer transactions used for recurring-merchant / recurring-payment detection */
  peerTransactions: EvidenceTransactionInput[];
}

export interface EvidenceEvaluation {
  level: EvidenceConfidenceLevel;
  score: number;
  factors: EvidenceFactorResult[];
  /** One-line summary for tooltips */
  summary: string;
  /** Supporting detail lines (factor phrases) */
  details: string[];
}

export interface EvidenceConfidenceCounts {
  high: number;
  medium: number;
  low: number;
  reviewRecommended: number;
  total: number;
}
