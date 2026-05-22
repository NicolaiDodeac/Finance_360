import { flowFlagsForPurposeChoice } from "@/lib/categorization/categorise-flow/flow-mappings";
import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import type {
  CategorisePurpose,
  CategoryChoiceId,
  ResolvedCategorisation,
} from "@/lib/categorization/categorise-flow/types";
import { resolveHmrcFromChoice } from "@/lib/categorization/hmrc-resolution";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

function findCategoryBySlug(
  categories: CategoryRow[],
  slug: string | null
): CategoryRow | null {
  if (!slug) return null;
  return categories.find((c) => c.slug === slug) ?? null;
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
  const hmrc = resolveHmrcFromChoice(
    hmrcCategories,
    spec.hmrcCode,
    hmrcOverrideId
  );

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
    hmrcCategoryCode: hmrc?.code ?? null,
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
