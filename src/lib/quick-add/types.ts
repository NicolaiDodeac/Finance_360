import type { CategorisePurpose, CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { FlowType } from "@/lib/transactions/flow-type";
import type {
  ReceiptPaymentMethod,
  TransactionDirection,
} from "@/types/database";

export type QuickAddConfidence = "high" | "review_recommended";

/** Raw output from the deterministic text parser (one segment). */
export interface QuickAddParsedSegment {
  originalSegment: string;
  merchantName: string;
  amount: number | null;
  direction: TransactionDirection;
  purpose: CategorisePurpose;
  categoryChoiceId: CategoryChoiceId | null;
  flowTypeOverride: FlowType | null;
  confidence: QuickAddConfidence;
  reviewRecommended: boolean;
  paymentMethod: ReceiptPaymentMethod | null;
}

/** Draft ready for review UI and save payload. */
export interface QuickAddDraft {
  id: string;
  originalSegment: string;
  transaction_date: string;
  merchant_name: string;
  description: string;
  amount: number;
  direction: TransactionDirection;
  purpose: CategorisePurpose;
  categoryChoiceId: CategoryChoiceId | null;
  categoryId: string | null;
  categoryName: string | null;
  hmrcCategoryId: string | null;
  hmrcCategoryName: string | null;
  hmrcCategoryCode: string | null;
  flowType: FlowType | null;
  isBusiness: boolean;
  countsAsTurnover: boolean;
  excludeFromIncome: boolean;
  excludeFromSpending: boolean;
  confidence: QuickAddConfidence;
  reviewRecommended: boolean;
  payment_method: ReceiptPaymentMethod | null;
}

export interface QuickAddSaveDraftInput {
  transaction_date: string;
  merchant_name: string;
  description: string;
  amount: number;
  direction: TransactionDirection;
  purpose: CategorisePurpose;
  category_choice: CategoryChoiceId | null;
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean;
  review_recommended: boolean;
  flow_type: FlowType | null;
  counts_as_turnover: boolean;
  exclude_from_income: boolean;
  exclude_from_spending: boolean;
  original_segment: string;
  payment_method?: ReceiptPaymentMethod | null;
}

export interface QuickAddSaveInput {
  original_text: string;
  drafts: QuickAddSaveDraftInput[];
}
