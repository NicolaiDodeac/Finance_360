export type {
  CategorisePurpose,
  CategoryChoiceId,
  PlainChoice,
  PrefillState,
  ResolvedCategorisation,
  RuleScope,
} from "@/lib/categorization/categorise-flow/types";
export { isIncomeDirection } from "@/lib/categorization/categorise-flow/types";
export {
  isAmbiguousMerchant,
  merchantDisplayName,
} from "@/lib/categorization/categorise-flow/ambiguous";
export {
  CHOICE_SPECS,
  FLOW_COPY,
  getCategoryChoices,
} from "@/lib/categorization/categorise-flow/mappings";
export {
  resolveCategoryChoice,
  resolvePurposeNotSure,
  shouldCreateRule,
} from "@/lib/categorization/categorise-flow/resolve";
export {
  choiceIdFromCategorySlug,
  isCategoryChoiceId,
  isIncomeTypeChoiceId,
  prefillFromSuggestion,
} from "@/lib/categorization/categorise-flow/prefill";
export {
  getIncomeTypeChoices,
  INCOME_FLOW_COPY,
  INCOME_TYPE_SPECS,
  inferIncomeTypeFromCategory,
  resolveIncomeTypeChoice,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
export { buildAssistantPatchFromResolved } from "@/lib/categorization/categorise-flow/assistant-patch";
export {
  buildApplyToastMessages,
  buildReviewSummary,
} from "@/lib/categorization/categorise-flow/review-summary";
