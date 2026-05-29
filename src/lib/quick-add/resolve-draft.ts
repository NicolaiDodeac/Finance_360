import { buildAssistantPatchFromResolved } from "@/lib/categorization/categorise-flow/assistant-patch";
import { resolveCategoryChoice } from "@/lib/categorization/categorise-flow/resolve";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { QuickAddDraft, QuickAddParsedSegment } from "@/lib/quick-add/types";
import type { FlowType } from "@/lib/transactions/flow-type";

function newDraftId(): string {
  return `qa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function resolveQuickAddDrafts(
  segments: QuickAddParsedSegment[],
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[],
  defaultTransactionDate: string
): QuickAddDraft[] {
  return segments.map((segment) => {
    const date = defaultTransactionDate;
    let categoryId: string | null = null;
    let categoryName: string | null = null;
    let hmrcCategoryId: string | null = null;
    let hmrcCategoryName: string | null = null;
    let hmrcCategoryCode: string | null = null;
    let isBusiness = false;
    let flowType: FlowType | null = segment.flowTypeOverride;
    let countsAsTurnover = false;
    let excludeFromIncome = false;
    let excludeFromSpending = false;

    const purpose: "personal" | "business" =
      segment.purpose === "business" ? "business" : "personal";

    if (segment.categoryChoiceId) {
      const resolved = resolveCategoryChoice(
        purpose,
        segment.categoryChoiceId,
        categories,
        hmrcCategories,
        null
      );

      categoryId = resolved.categoryId;
      categoryName = resolved.categoryName;
      isBusiness = resolved.isBusiness;
      flowType = segment.flowTypeOverride ?? resolved.flowType ?? null;
      countsAsTurnover = resolved.countsAsTurnover ?? false;
      excludeFromIncome = resolved.excludeFromIncome ?? false;
      excludeFromSpending = resolved.excludeFromSpending ?? false;

      const allowHmrc =
        !segment.reviewRecommended &&
        purpose === "business" &&
        resolved.isBusiness &&
        Boolean(resolved.hmrcCategoryId);

      if (allowHmrc) {
        hmrcCategoryId = resolved.hmrcCategoryId;
        hmrcCategoryName = resolved.hmrcCategoryName;
        hmrcCategoryCode = resolved.hmrcCategoryCode ?? null;
      }
    }

    const amount = segment.amount ?? 0;

    return {
      id: newDraftId(),
      originalSegment: segment.originalSegment,
      transaction_date: date,
      merchant_name: segment.merchantName,
      description: segment.merchantName,
      amount,
      direction: segment.direction,
      purpose,
      categoryChoiceId: segment.categoryChoiceId,
      categoryId,
      categoryName,
      hmrcCategoryId,
      hmrcCategoryName,
      hmrcCategoryCode,
      flowType,
      isBusiness,
      countsAsTurnover,
      excludeFromIncome,
      excludeFromSpending,
      confidence: segment.confidence,
      reviewRecommended: segment.reviewRecommended || amount <= 0,
      payment_method: segment.paymentMethod,
    };
  });
}

export function draftToAssistantPatch(draft: QuickAddDraft) {
  if (!draft.categoryChoiceId) {
    return {
      review_recommended: draft.reviewRecommended,
      purpose: draft.purpose,
      flow_type: draft.flowType ?? undefined,
      counts_as_turnover: draft.countsAsTurnover,
      exclude_from_income: draft.excludeFromIncome,
      exclude_from_spending: draft.excludeFromSpending,
    };
  }

  const resolved = {
    categoryId: draft.categoryId,
    categoryName: draft.categoryName,
    hmrcCategoryId: draft.hmrcCategoryId,
    hmrcCategoryName: draft.hmrcCategoryName,
    hmrcCategoryCode: draft.hmrcCategoryCode,
    isBusiness: draft.isBusiness,
    businessUsePercent: draft.isBusiness ? 100 : null,
    markReviewRecommended: draft.reviewRecommended,
    evidenceRecommendation: null,
    requiresBusinessUsePercent: false,
    skipCategoryAssignment: false,
    choiceLabel: draft.categoryName ?? "",
    purpose: draft.purpose,
    flowType: draft.flowType ?? undefined,
    countsAsTurnover: draft.countsAsTurnover,
    excludeFromIncome: draft.excludeFromIncome,
    excludeFromSpending: draft.excludeFromSpending,
  };

  return buildAssistantPatchFromResolved(
    resolved,
    draft.categoryChoiceId,
    undefined
  );
}
