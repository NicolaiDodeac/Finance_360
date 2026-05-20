import type { CategorySuggestion } from "@/lib/categorization/suggestions";
import type { TransactionDirection } from "@/types/database";

export interface AssistantTransactionRow {
  id: string;
  description: string | null;
  merchant_name: string | null;
  amount: number;
  direction: TransactionDirection;
  transaction_date: string;
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean;
  raw_import_data: Record<string, unknown> | null;
}

export interface MerchantGroupExample {
  id: string;
  transaction_date: string;
  description: string | null;
  amount: number;
}

/** One strict description variant inside a merged merchant group. */
export interface MerchantSubgroup {
  strictKey: string;
  merchantLabel: string;
  matchKeyword: string;
  transactionCount: number;
  totalAmount: number;
  transactionIds: string[];
  examples: MerchantGroupExample[];
}

export interface MerchantGroup {
  groupKey: string;
  merchantLabel: string;
  matchKeyword: string;
  direction: TransactionDirection;
  transactionCount: number;
  totalAmount: number;
  transactionIds: string[];
  examples: MerchantGroupExample[];
  suggestion: CategorySuggestion | null;
  /** Strict keys merged into this card (for apply validation). */
  strictGroupKeys: string[];
  /** True when multiple bank descriptions were combined (e.g. Amazon variants). */
  isCombined: boolean;
  /** Per-description breakdown; used when user chooses to split. */
  subgroups?: MerchantSubgroup[];
}

export interface GroupCategorisationInput {
  groupKey: string;
  /** Strict description keys included in this apply (merged groups). */
  strict_group_keys?: string[];
  transactionIds: string[];
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean;
  business_use_percent?: number | null;
  create_rule: boolean;
  /** Set raw_import_data assistant flags without assigning a category. */
  mark_review_recommended?: boolean;
  evidence_recommendation?: string | null;
  purpose?: string;
  category_choice?: string;
  income_type?: string;
  counts_as_turnover?: boolean;
  exclude_from_income?: boolean;
  exclude_from_spending?: boolean;
  flow_type?: import("@/lib/transactions/flow-type").FlowType;
  rule_scope?: string;
}

export interface ApplyGroupResult {
  updatedCount: number;
  ruleId: string | null;
}

