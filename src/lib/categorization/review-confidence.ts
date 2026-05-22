import type { ResolvedCategorisation } from "@/lib/categorization/categorise-flow/types";
import type { CategorisationReviewContext } from "@/lib/categorization/review-types";
import {
  isHighConfidenceSuggestion,
  type CategorySuggestion,
} from "@/lib/categorization/suggestions";
import type { CategorisePurpose } from "@/lib/categorization/categorise-flow/types";
import type { TransactionDirection } from "@/types/database";

export function shouldUseCompactReview(input: {
  suggestion: CategorySuggestion | null;
  resolved: ResolvedCategorisation | null;
  purpose: CategorisePurpose;
  direction: TransactionDirection;
  amountValid?: boolean;
  dateValid?: boolean;
  merchantKnown?: boolean;
}): boolean {
  if (!input.resolved || input.purpose === "not_sure") return false;
  if (input.resolved.markReviewRecommended) return false;
  if (!input.amountValid || !input.dateValid) return false;

  const highSuggestion =
    input.suggestion && isHighConfidenceSuggestion(input.suggestion);
  const personalExpense =
    input.direction === "expense" &&
    input.purpose === "personal" &&
    !input.resolved.isBusiness;

  if (personalExpense && highSuggestion && input.merchantKnown !== false) {
    return true;
  }

  if (
    input.purpose === "business" &&
    highSuggestion &&
    input.resolved.hmrcCategoryId &&
    input.merchantKnown !== false
  ) {
    return true;
  }

  return (
    highSuggestion === true &&
    Boolean(input.resolved.categoryId) &&
    input.merchantKnown !== false
  );
}

export function buildReviewContext(input: {
  detected: CategorisationReviewContext["detected"];
  suggested: CategorisationReviewContext["suggested"];
  direction: TransactionDirection;
  purpose: CategorisePurpose;
  isBusiness: boolean;
  suggestion: CategorySuggestion | null;
  resolved: ResolvedCategorisation | null;
  amountValid?: boolean;
  dateValid?: boolean;
  merchantKnown?: boolean;
}): CategorisationReviewContext {
  const confidence =
    input.suggestion?.confidence ??
    (input.resolved?.markReviewRecommended ? "low" : "medium");

  const compactMode = shouldUseCompactReview({
    suggestion: input.suggestion,
    resolved: input.resolved,
    purpose: input.purpose,
    direction: input.direction,
    amountValid: input.amountValid,
    dateValid: input.dateValid,
    merchantKnown: input.merchantKnown,
  });

  const hideAccountingByDefault =
    compactMode ||
    (input.purpose === "personal" && !input.isBusiness) ||
    input.direction === "income";

  return {
    direction: input.direction,
    purpose: input.purpose,
    isBusiness: input.isBusiness,
    confidence,
    detected: input.detected,
    suggested: input.suggested,
    hideAccountingByDefault,
    compactMode,
  };
}

export function purposeDisplayLabel(purpose: CategorisePurpose): string {
  switch (purpose) {
    case "business":
      return "Business";
    case "personal":
      return "Personal";
    default:
      return "Needs review";
  }
}
