import type { TransactionDirection } from "@/types/database";

export type CategorisePurpose = "personal" | "business" | "not_sure";

export type RuleScope =
  | "group_only"
  | "future_similar"
  | "transaction_only";

export type CategoryChoiceId =
  // Personal income
  | "salary"
  | "refund"
  | "own_transfer"
  | "gift"
  | "other_personal_income"
  // Personal expense
  | "groceries"
  | "rent_mortgage"
  | "utilities"
  | "phone_internet"
  | "subscriptions"
  | "transport"
  | "fuel"
  | "insurance"
  | "children_family"
  | "eating_out"
  | "entertainment"
  | "clothing"
  | "health"
  | "car_maintenance"
  | "education"
  | "bank_fees"
  | "other_personal_expense"
  | "savings_contribution"
  | "investment_contribution"
  | "debt_repayment"
  | "credit_card_repayment"
  | "transfer_between_accounts"
  | "tax_payment"
  // Business income
  | "business_turnover"
  | "business_refund"
  | "owner_transfer"
  | "other_business_income"
  // Business expense
  | "software_digital"
  | "biz_phone_internet"
  | "stock_materials"
  | "equipment_tools"
  | "fuel_travel"
  | "advertising_marketing"
  | "training_education"
  | "professional_help"
  | "bank_fees_finance"
  | "premises_utilities"
  | "repairs_maintenance"
  | "mixed_personal_business"
  | "other_business_expense";

export interface PlainChoice {
  id: string;
  label: string;
}

export interface ResolvedCategorisation {
  categoryId: string | null;
  categoryName: string | null;
  hmrcCategoryId: string | null;
  hmrcCategoryName: string | null;
  isBusiness: boolean;
  businessUsePercent: number | null;
  markReviewRecommended: boolean;
  evidenceRecommendation: string | null;
  requiresBusinessUsePercent: boolean;
  skipCategoryAssignment: boolean;
  choiceLabel: string;
  purpose: CategorisePurpose;
  /** Income-first flow choice (when direction is income). */
  incomeTypeId?: import("@/lib/categorization/categorise-flow/income-types").IncomeTypeChoiceId;
  /** Counts toward self-employed turnover (income only). */
  countsAsTurnover?: boolean;
  /** Excluded from income insights (e.g. own-account transfers). */
  excludeFromIncome?: boolean;
  /** Excluded from spending insights (e.g. own-account transfers). */
  excludeFromSpending?: boolean;
  flowType?: import("@/lib/transactions/flow-type").FlowType;
}

export interface PrefillState {
  purpose?: CategorisePurpose;
  choiceId?: CategoryChoiceId;
  incomeTypeId?: import("@/lib/categorization/categorise-flow/income-types").IncomeTypeChoiceId;
  prefillReason: string;
  fromRule: boolean;
}

export function isIncomeDirection(
  direction: TransactionDirection | string
): direction is "income" {
  return direction === "income";
}
