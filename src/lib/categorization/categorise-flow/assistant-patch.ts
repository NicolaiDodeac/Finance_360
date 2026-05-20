import type { ResolvedCategorisation } from "@/lib/categorization/categorise-flow/types";
import type { AssistantTransactionMetadata } from "@/lib/categorization/assistant-metadata";

export function buildAssistantPatchFromResolved(
  resolved: ResolvedCategorisation,
  choiceKey: string | undefined,
  ruleScope: string | undefined
): AssistantTransactionMetadata {
  const base: AssistantTransactionMetadata = {
    review_recommended: resolved.markReviewRecommended,
    evidence_recommendation: resolved.evidenceRecommendation ?? undefined,
    purpose: resolved.purpose,
    flow_type: resolved.flowType,
    category_choice: choiceKey,
    rule_scope: ruleScope,
    counts_as_turnover: resolved.countsAsTurnover ?? false,
    exclude_from_income: resolved.excludeFromIncome ?? false,
    exclude_from_spending: resolved.excludeFromSpending ?? false,
  };

  if (resolved.incomeTypeId) {
    base.income_type = resolved.incomeTypeId;
    base.category_choice = resolved.incomeTypeId;
  }

  return base;
}
