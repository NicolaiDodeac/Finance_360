import { getFlowTypeForIncomeType } from "@/lib/categorization/categorise-flow/flow-mappings";
import type {
  CategorisePurpose,
  ResolvedCategorisation,
} from "@/lib/categorization/categorise-flow/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { PlainChoice } from "@/lib/categorization/categorise-flow/types";

/** Income-first categorisation choices (no personal/business step). */
export type IncomeTypeChoiceId =
  | "employment_salary"
  | "self_employed_income"
  | "account_transfer"
  | "refund_income"
  | "investment_income"
  | "gift_income"
  | "benefit_payment"
  | "other_income"
  | "income_not_sure";

export interface IncomeTypeSpec {
  label: string;
  categorySlug: string | null;
  isBusiness: boolean;
  countsAsTurnover: boolean;
  excludeFromIncome: boolean;
  excludeFromSpending: boolean;
  markReviewRecommended?: boolean;
  evidenceRecommendation: string | null;
  impliedPurpose: CategorisePurpose;
}

export const INCOME_TYPE_SPECS: Record<IncomeTypeChoiceId, IncomeTypeSpec> = {
  employment_salary: {
    label: "Employment salary",
    categorySlug: "salary",
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: false,
    excludeFromSpending: false,
    evidenceRecommendation: null,
    impliedPurpose: "personal",
  },
  self_employed_income: {
    label: "Self-employed / business income",
    categorySlug: "self-employed-income",
    isBusiness: true,
    countsAsTurnover: true,
    excludeFromIncome: false,
    excludeFromSpending: false,
    evidenceRecommendation:
      "Keep invoices or payment records — this counts as trading turnover.",
    impliedPurpose: "business",
  },
  account_transfer: {
    label: "Transfer between my accounts",
    categorySlug: "savings-transfer",
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: true,
    excludeFromSpending: true,
    evidenceRecommendation: null,
    impliedPurpose: "personal",
  },
  refund_income: {
    label: "Refund",
    categorySlug: "refunds",
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: true,
    excludeFromSpending: false,
    evidenceRecommendation: null,
    impliedPurpose: "personal",
  },
  investment_income: {
    label: "Investment income",
    categorySlug: "investment-income",
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: false,
    excludeFromSpending: false,
    evidenceRecommendation: null,
    impliedPurpose: "personal",
  },
  gift_income: {
    label: "Gift",
    categorySlug: "gifts",
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: false,
    excludeFromSpending: false,
    evidenceRecommendation: null,
    impliedPurpose: "personal",
  },
  benefit_payment: {
    label: "Benefit payment",
    categorySlug: "benefits",
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: false,
    excludeFromSpending: false,
    evidenceRecommendation: null,
    impliedPurpose: "personal",
  },
  other_income: {
    label: "Other income",
    categorySlug: "other-income",
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: false,
    excludeFromSpending: false,
    evidenceRecommendation: null,
    impliedPurpose: "personal",
  },
  income_not_sure: {
    label: "Not sure",
    categorySlug: null,
    isBusiness: false,
    countsAsTurnover: false,
    excludeFromIncome: false,
    excludeFromSpending: false,
    markReviewRecommended: true,
    evidenceRecommendation: null,
    impliedPurpose: "not_sure",
  },
};

const INCOME_TYPE_ORDER: IncomeTypeChoiceId[] = [
  "employment_salary",
  "self_employed_income",
  "account_transfer",
  "refund_income",
  "investment_income",
  "gift_income",
  "benefit_payment",
  "other_income",
  "income_not_sure",
];

export const INCOME_FLOW_COPY = {
  question: "What kind of income is this?",
  hint: "Choose the type of income. Finance 360 will organise the rest.",
} as const;

export function getIncomeTypeChoices(): PlainChoice[] {
  return INCOME_TYPE_ORDER.map((id) => ({
    id,
    label: INCOME_TYPE_SPECS[id].label,
  }));
}

export function isIncomeTypeChoiceId(id: string): id is IncomeTypeChoiceId {
  return id in INCOME_TYPE_SPECS;
}

function findCategoryBySlug(
  categories: CategoryRow[],
  slug: string | null
): CategoryRow | null {
  if (!slug) return null;
  return categories.find((c) => c.slug === slug) ?? null;
}

/** Infer income type from a saved category slug (rules / legacy data). */
export function inferIncomeTypeFromCategory(
  categorySlug: string | undefined,
  isBusiness: boolean
): IncomeTypeChoiceId | null {
  if (!categorySlug) return null;

  if (categorySlug === "self-employed-income" && isBusiness) {
    return "self_employed_income";
  }
  if (categorySlug === "salary") return "employment_salary";
  if (categorySlug === "savings-transfer") return "account_transfer";
  if (categorySlug === "refunds") return "refund_income";
  if (categorySlug === "investment-income") return "investment_income";
  if (categorySlug === "gifts") return "gift_income";
  if (categorySlug === "benefits") return "benefit_payment";
  if (categorySlug === "other-income") {
    return isBusiness ? "self_employed_income" : "other_income";
  }

  return null;
}

export function resolveIncomeTypeChoice(
  incomeTypeId: IncomeTypeChoiceId,
  categories: CategoryRow[]
): ResolvedCategorisation {
  const spec = INCOME_TYPE_SPECS[incomeTypeId];

  if (spec.markReviewRecommended) {
    return {
      categoryId: null,
      categoryName: null,
      hmrcCategoryId: null,
      hmrcCategoryName: null,
      isBusiness: false,
      businessUsePercent: null,
      markReviewRecommended: true,
      evidenceRecommendation: null,
      requiresBusinessUsePercent: false,
      skipCategoryAssignment: true,
      choiceLabel: spec.label,
      purpose: "not_sure",
      incomeTypeId,
      countsAsTurnover: false,
      excludeFromIncome: false,
      excludeFromSpending: false,
    };
  }

  const category = findCategoryBySlug(categories, spec.categorySlug);
  const flow = getFlowTypeForIncomeType(incomeTypeId);

  return {
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? spec.label,
    hmrcCategoryId: null,
    hmrcCategoryName: null,
    isBusiness: spec.isBusiness,
    businessUsePercent: null,
    markReviewRecommended: false,
    evidenceRecommendation: spec.evidenceRecommendation,
    requiresBusinessUsePercent: false,
    skipCategoryAssignment: false,
    choiceLabel: spec.label,
    purpose: spec.impliedPurpose,
    incomeTypeId,
    flowType: flow.flowType,
    countsAsTurnover: flow.countsAsTurnover,
    excludeFromIncome: flow.excludeFromIncome,
    excludeFromSpending: flow.excludeFromSpending,
  };
}
