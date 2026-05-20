import { flowFlagsForPurposeChoice } from "@/lib/categorization/categorise-flow/flow-mappings";
import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import type {
  CategorisePurpose,
  CategoryChoiceId,
  ResolvedCategorisation,
} from "@/lib/categorization/categorise-flow/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

function findCategoryBySlug(
  categories: CategoryRow[],
  slug: string | null
): CategoryRow | null {
  if (!slug) return null;
  return categories.find((c) => c.slug === slug) ?? null;
}

function findHmrcByCode(
  hmrcCategories: HmrcCategoryRow[],
  code: string | null
): HmrcCategoryRow | null {
  if (!code) return null;
  return hmrcCategories.find((h) => h.code === code) ?? null;
}

export function resolveCategoryChoice(
  purpose: CategorisePurpose,
  choiceId: CategoryChoiceId,
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[],
  businessUsePercent: number | null,
  hmrcOverrideId?: string | null
): ResolvedCategorisation {
  const spec = CHOICE_SPECS[choiceId];
  const category = findCategoryBySlug(categories, spec.categorySlug);
  const hmrc =
    hmrcOverrideId !== undefined
      ? hmrcCategories.find((h) => h.id === hmrcOverrideId) ?? null
      : findHmrcByCode(hmrcCategories, spec.hmrcCode);

  let percent: number | null = null;
  if (spec.isBusiness) {
    percent =
      businessUsePercent !== null
        ? Math.min(100, Math.max(0, businessUsePercent))
        : 100;
  }

  const flow = flowFlagsForPurposeChoice(purpose, choiceId);

  return {
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? spec.label,
    hmrcCategoryId: hmrc?.id ?? null,
    hmrcCategoryName: hmrc?.name ?? null,
    isBusiness: spec.isBusiness,
    businessUsePercent: percent,
    markReviewRecommended: false,
    evidenceRecommendation: spec.evidenceRecommendation,
    requiresBusinessUsePercent: spec.requiresBusinessUsePercent ?? false,
    skipCategoryAssignment: false,
    choiceLabel: spec.label,
    purpose,
    flowType: flow.flowType,
    countsAsTurnover: flow.countsAsTurnover,
    excludeFromIncome: flow.excludeFromIncome,
    excludeFromSpending: flow.excludeFromSpending,
  };
}

export function resolvePurposeNotSure(): ResolvedCategorisation {
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
    choiceLabel: "Not sure",
    purpose: "not_sure",
  };
}

export function shouldCreateRule(
  rememberEnabled: boolean,
  ruleScope: import("@/lib/categorization/categorise-flow/types").RuleScope
): boolean {
  return rememberEnabled && ruleScope === "future_similar";
}
