import type { ReceiptPurpose } from "@/lib/receipts/classify";
import type { ReceiptCreationSuggestion } from "@/lib/receipts/suggest";
import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import type {
  Database,
  FinanceMode,
  ReceiptPaymentMethod,
  ReceiptStatus,
} from "@/types/database";

export type { ReceiptPurpose };

export type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
export type { ReceiptStatus };
export type { ReceiptPaymentMethod };

export interface LinkedReceiptOnTransaction {
  id: string;
  merchant_name: string | null;
  original_filename: string | null;
  total_amount: number | null;
  receipt_date: string | null;
}

export interface ReceiptAttachedTransaction {
  id: string;
  transaction_date: string;
  description: string | null;
  merchant_name: string | null;
  amount: number;
  direction: string;
  is_business: boolean;
  receipt_id: string | null;
  category_id: string | null;
  hmrc_category_id: string | null;
  tax_year_id: string | null;
  account_id: string | null;
  category_name?: string | null;
  hmrc_category_name?: string | null;
  linked_receipt?: LinkedReceiptOnTransaction | null;
  account: {
    id: string;
    name: string;
    account_type: string;
  } | null;
}

export type ReceiptTransactionKind =
  | "cash_expense"
  | "card_manual_expense"
  | "cash_income"
  | "business_income";

export interface CreateTransactionFromReceiptInput {
  purpose: ReceiptPurpose;
  payment_method?: ReceiptPaymentMethod | null;
  /** Explicit category chosen by the user — overrides the detected one. */
  category_choice_id?:
    | import("@/lib/categorization/categorise-flow/types").CategoryChoiceId
    | null;
  /** Skip creation (user chose "Skip for now"). */
  skip?: boolean;
  /** Record as income — only when user explicitly chooses. */
  record_as_income?: boolean;
  income_kind?: "cash_income" | "business_income";
}

export type MatchConfidence = "strong" | "medium" | "weak" | "none";

export interface ReceiptMatchDebug {
  amountDiff: number | null;
  amountTier: MatchConfidence | "n/a";
  dateDiff: number | null;
  dateTier: MatchConfidence | "n/a";
  merchantTier:
    | "strong"
    | "medium"
    | "none"
    | "contradictory"
    | "n/a";
  finalConfidence: MatchConfidence;
  compositeScore: number;
}

export interface ReceiptCaptureReviewData {
  receipt: ReceiptWithRelations;
  receiptStatus: ReceiptStatus;
  extraction: ReceiptOcrExtraction;
  suggestedMatch: ReceiptMatchCandidate | null;
  closestMatch: ReceiptMatchCandidate | null;
  candidates: ReceiptMatchCandidate[];
  financeMode: FinanceMode;
  creationSuggestion: ReceiptCreationSuggestion;
  showPaymentPrompt: boolean;
  classificationLooksBusiness: boolean;
  /** Other uploads of the same purchase (duplicate scans). */
  similarReceipts: import("@/lib/receipts/duplicate-receipts").SimilarReceiptInfo[];
}

export interface ReceiptWithRelations extends ReceiptRow {
  tax_year: Pick<TaxYearRow, "id" | "label"> | null;
  attached_transaction: ReceiptAttachedTransaction | null;
}

export interface ReceiptFormInput {
  merchant_name: string;
  receipt_date: string;
  total_amount: number | null;
  vat_amount: number | null;
  payment_method: ReceiptPaymentMethod | null;
  notes: string;
  tax_year_id: string | null;
}

export type ReceiptMatchLinkState =
  import("@/lib/receipts/match-link-state").ReceiptMatchLinkState;

export interface ReceiptMatchCandidate {
  transaction: ReceiptAttachedTransaction;
  confidence: MatchConfidence;
  score: number;
  reasons: string[];
  debug: ReceiptMatchDebug;
  linkState: ReceiptMatchLinkState;
  linkedReceipt: import("@/lib/receipts/match-link-state").LinkedReceiptSummary | null;
}

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}
