export {
  createSavingsGoal,
  createSavingsGoalForm,
  updateGoalProgress,
} from "@/lib/goals/actions";
export {
  buildGoalSummary,
  formatGoalDate,
  goalProgress,
  goalRemaining,
  goalStatusLabel,
  goalSuggestedMonthly,
  goalMonthlyContributionLine,
  suggestedMonthlyHint,
} from "@/lib/goals/calculations";
export {
  getActiveSavingsGoals,
  getAllSavingsGoals,
  getSimpleGoalsWithoutDetails,
  type SavingsGoalWithMeta,
} from "@/lib/goals/queries";
export { goalProgressPercent, type SavingsGoalRow } from "@/lib/goals/types";
