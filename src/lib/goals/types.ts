import type { Database } from "@/types/database";

export type SavingsGoalRow =
  Database["public"]["Tables"]["savings_goals"]["Row"];

export function goalProgressPercent(goal: SavingsGoalRow): number {
  if (goal.target_amount <= 0) return 0;
  return Math.min(
    100,
    Math.round((goal.current_amount / goal.target_amount) * 100)
  );
}
