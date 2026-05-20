import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import {
  inferIncomeTypeFromCategory,
  isIncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
import type {
  CategorisePurpose,
  CategoryChoiceId,
  PrefillState,
} from "@/lib/categorization/categorise-flow/types";
import type { CategorySuggestion } from "@/lib/categorization/suggestions";
import type { CategoryRow } from "@/lib/categories/queries";
import type { TransactionDirection } from "@/types/database";

const SLUG_TO_CHOICE: Partial<Record<string, CategoryChoiceId>> = {
  salary: "salary",
  refunds: "refund",
  "savings-transfer": "own_transfer",
  gifts: "gift",
  "other-income": "other_personal_income",
  "self-employed-income": "business_turnover",
  groceries: "groceries",
  "rent-mortgage": "rent_mortgage",
  utilities: "utilities",
  "phone-internet": "phone_internet",
  subscriptions: "subscriptions",
  transport: "transport",
  fuel: "fuel",
  insurance: "insurance",
  "children-family": "children_family",
  "eating-out": "eating_out",
  entertainment: "entertainment",
  clothing: "clothing",
  health: "health",
  "car-maintenance": "car_maintenance",
  education: "education",
  "bank-fees": "bank_fees",
  "savings-contribution": "savings_contribution",
  "investment-contribution": "investment_contribution",
  "debt-repayment": "debt_repayment",
  "tax-payment": "tax_payment",
  "other-expense": "other_personal_expense",
};

const BUSINESS_EXPENSE_SLUG: Partial<Record<string, CategoryChoiceId>> = {
  subscriptions: "software_digital",
  "phone-internet": "biz_phone_internet",
  fuel: "fuel_travel",
  education: "training_education",
  "bank-fees": "bank_fees_finance",
  utilities: "premises_utilities",
  "car-maintenance": "repairs_maintenance",
  "other-expense": "other_business_expense",
};

function slugToChoice(
  slug: string | undefined,
  purpose: CategorisePurpose,
  direction: TransactionDirection
): CategoryChoiceId | null {
  if (!slug) return null;

  if (purpose === "business" && direction === "expense") {
    const biz = BUSINESS_EXPENSE_SLUG[slug];
    if (biz) return biz;
    return "other_business_expense";
  }

  if (purpose === "business" && direction === "income") {
    if (slug === "self-employed-income") return "business_turnover";
    if (slug === "refunds") return "business_refund";
    if (slug === "savings-transfer") return "owner_transfer";
    if (slug === "other-income") return "other_business_income";
    return "other_business_income";
  }

  const direct = SLUG_TO_CHOICE[slug];
  if (!direct) {
    return direction === "expense" ? "other_personal_expense" : "other_personal_income";
  }

  if (purpose === "personal" && direction === "expense" && direct === "other_personal_income") {
    return "other_personal_expense";
  }

  return direct;
}

export function prefillFromSuggestion(
  suggestion: CategorySuggestion | null,
  categories: CategoryRow[],
  direction: TransactionDirection
): PrefillState | null {
  if (!suggestion?.categoryId) return null;

  const category = categories.find((c) => c.id === suggestion.categoryId);
  if (!category?.slug) return null;

  const fromRule = suggestion.source === "rule";
  const reason = fromRule
    ? `Based on your saved rule${suggestion.ruleName ? `: ${suggestion.ruleName}` : ""}.`
    : suggestion.reason;

  if (direction === "income") {
    const incomeTypeId = inferIncomeTypeFromCategory(
      category.slug,
      suggestion.isBusiness
    );
    if (!incomeTypeId) return null;

    return {
      incomeTypeId,
      prefillReason: reason,
      fromRule,
    };
  }

  const purpose: CategorisePurpose = suggestion.isBusiness
    ? "business"
    : "personal";

  const choiceId = slugToChoice(category.slug, purpose, direction);
  if (!choiceId) return null;

  return {
    purpose,
    choiceId,
    prefillReason: reason,
    fromRule,
  };
}

/** Validate expense category choice exists in spec (type guard). */
export function isCategoryChoiceId(id: string): id is CategoryChoiceId {
  return id in CHOICE_SPECS;
}

export { isIncomeTypeChoiceId };
