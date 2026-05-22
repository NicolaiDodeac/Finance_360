import type { CategorisePurpose } from "@/lib/categorization/categorise-flow/types";
import type { SuggestionConfidence } from "@/lib/categorization/suggestions";
import type { TransactionDirection } from "@/types/database";

/** Values shown in the universal review card (detected row). */
export interface CategorisationReviewDetected {
  merchant?: string | null;
  amount?: string | null;
  paymentMethod?: string | null;
  date?: string | null;
}

/** Values shown in the universal review card (suggested row). */
export interface CategorisationReviewSuggested {
  purposeLabel?: string | null;
  categoryLabel: string;
  businessPersonalLabel: string;
  hmrcLabel?: string | null;
  usuallyNote?: string | null;
  taxNote?: string | null;
  evidenceNote?: string | null;
}

export type ReviewDisplayConfidence = SuggestionConfidence;

export interface CategorisationReviewContext {
  direction: TransactionDirection;
  purpose: CategorisePurpose;
  isBusiness: boolean;
  confidence: ReviewDisplayConfidence;
  detected: CategorisationReviewDetected;
  suggested: CategorisationReviewSuggested;
  /** Hide HMRC / tax year / business % unless user expands advanced or confidence is low. */
  hideAccountingByDefault: boolean;
  /** Single-tap confirm without extra blocks. */
  compactMode: boolean;
}
