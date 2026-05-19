import type { Database } from "@/types/database";
import type { SavingsGoalRow } from "@/lib/goals/types";

export type SavingsGoalType =
  Database["public"]["Enums"]["savings_goal_type"];

export type SavingsGoalDetailsRow =
  Database["public"]["Tables"]["savings_goal_details"]["Row"];

export type PlanningStatus = "on_track" | "gentle_boost" | "adjust_date";

export interface PlanningPlan {
  goal: SavingsGoalRow;
  details: SavingsGoalDetailsRow;
  progressPercent: number;
  suggestedMonthly: number | null;
  status: PlanningStatus;
}

export const PLANNING_GOAL_TYPES: SavingsGoalType[] = [
  "house_deposit",
  "trip",
  "emergency_fund",
  "big_purchase",
  "debt_payoff",
];

export const ACTIVE_PLANNING_TYPES: SavingsGoalType[] = [
  "house_deposit",
  "trip",
  "emergency_fund",
  "big_purchase",
];
