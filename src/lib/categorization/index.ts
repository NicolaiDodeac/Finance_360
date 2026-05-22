export type {
  CategorizationMetadata,
  CategorizationRuleFormInput,
  CategorizationRuleRow,
  RuleApplication,
  RuleMatchField,
  RuleMatchType,
  RuleMatchableTransaction,
} from "@/lib/categorization/types";

export {
  applyCategorizationRules,
  buildCategorizationMetadata,
  getCategorizationFromRaw,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";

export {
  applyRulesToImportRow,
  collectMatchedRuleIds,
} from "@/lib/categorization/apply-batch";

export { findMatchingRule, ruleMatchesTransaction } from "@/lib/categorization/match";

export {
  categorizationChanged,
  filterRetroactiveTargets,
  inferMatchKeyword,
  transactionMatchesAnchor,
} from "@/lib/categorization/retroactive";

export { applyRetroactiveCategorization } from "@/lib/categorization/retroactive-apply";

export { getCategorizationRules, getCategorizationRuleById } from "@/lib/categorization/queries";
export {
  dryRunRuleRepair,
  dryRunRuleRepairForUser,
  executeRuleRepair,
  gatherRuleAssistantHints,
} from "@/lib/categorization/rule-repair";

export {
  createCategorizationRule,
  deleteCategorizationRule,
  updateCategorizationRule,
} from "@/lib/categorization/actions";

export {
  emptyRuleForm,
  ruleFormFromTransaction,
  ruleToFormInput,
} from "@/lib/categorization/rule-form";

export {
  suggestWithMerchantMemory,
  MERCHANT_MEMORY_CONFIRM_THRESHOLD,
} from "@/lib/categorization/merchant-memory";

export {
  buildMerchantMemoryIndex,
  lookupMerchantMemory,
} from "@/lib/categorization/merchant-memory-index";
