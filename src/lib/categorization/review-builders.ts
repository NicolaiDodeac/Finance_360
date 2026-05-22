import type { ResolvedCategorisation } from "@/lib/categorization/categorise-flow/types";
import type { CategorisePurpose } from "@/lib/categorization/categorise-flow/types";
import {
  purposeDisplayLabel,
} from "@/lib/categorization/review-confidence";
import type {
  CategorisationReviewDetected,
  CategorisationReviewSuggested,
} from "@/lib/categorization/review-types";
import type { CategorySuggestion } from "@/lib/categorization/suggestions";

export function buildSuggestedFromResolved(
  resolved: ResolvedCategorisation,
  purpose: CategorisePurpose,
  suggestion: CategorySuggestion | null
): CategorisationReviewSuggested {
  const usuallyNote =
    suggestion?.reason &&
    (suggestion.reason.startsWith("Usually") ||
      suggestion.reason.startsWith("Often"))
      ? suggestion.reason
      : suggestion?.confidence === "high" && suggestion.reason
        ? suggestion.reason
        : null;

  const taxNote =
    purpose === "personal"
      ? null
      : resolved.hmrcCategoryId
        ? "Tax category filled automatically."
        : resolved.isBusiness
          ? "Tax category may need a quick check."
          : null;

  return {
    purposeLabel:
      purpose === "not_sure" ? "Not sure yet" : purposeDisplayLabel(purpose),
    categoryLabel: resolved.categoryName ?? resolved.choiceLabel ?? "Expense",
    businessPersonalLabel: resolved.isBusiness ? "Business" : "Personal",
    hmrcLabel:
      purpose === "business" && resolved.hmrcCategoryName
        ? resolved.hmrcCategoryName
        : null,
    usuallyNote,
    taxNote,
    evidenceNote: resolved.evidenceRecommendation,
  };
}

export function buildDetectedFields(input: {
  merchant?: string | null;
  amount?: string | null;
  paymentMethod?: string | null;
  date?: string | null;
}): CategorisationReviewDetected {
  return {
    merchant: input.merchant?.trim() || null,
    amount: input.amount ?? null,
    paymentMethod: input.paymentMethod ?? null,
    date: input.date ?? null,
  };
}
