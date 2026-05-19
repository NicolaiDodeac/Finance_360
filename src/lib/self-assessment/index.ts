export {
  SA103_EXPENSE_GROUPS,
  SA_PREP_STEPS,
} from "@/lib/self-assessment/constants";
export type { Sa103ExpenseGroupDefinition } from "@/lib/self-assessment/constants";
export {
  computeSelfAssessmentPrepSummary,
  computeSelfAssessmentPrepSummaryWithRules,
} from "@/lib/self-assessment/calculations";
export { getSelfAssessmentPrepData } from "@/lib/self-assessment/queries";
export type {
  SaCopySummary,
  SaExpenseGroupRow,
  SaIncomeSection,
  SaLikelyBusinessIncomeItem,
  SaPrepData,
  SaPrepStepState,
  SaPrepStepStatus,
  SaPrepSummary,
} from "@/lib/self-assessment/types";
