import { goalProgressPercent, type SavingsGoalRow } from "@/lib/goals/types";
import {
  computeGoalStatus,
  goalStatusLabel,
  roundMoney,
  suggestedMonthlyContribution,
} from "@/lib/goals/calculations";
import type {
  PlanningPlan,
  PlanningStatus,
  SavingsGoalDetailsRow,
  SavingsGoalType,
} from "@/lib/planning/types";

export {
  monthsBetween,
  parseGoalDate as parsePlanDate,
  roundMoney,
  suggestedMonthlyContribution,
  formatGoalDate as formatPlanDate,
} from "@/lib/goals/calculations";

export function computeHouseDepositTarget(
  propertyPrice: number,
  depositPercent: number
): number {
  return roundMoney((propertyPrice * depositPercent) / 100);
}

export function computeEmergencyFundTarget(
  monthlyEssentials: number,
  monthsCover: number
): number {
  return roundMoney(monthlyEssentials * monthsCover);
}

export function computePlanningStatus(
  targetAmount: number,
  currentAmount: number,
  targetDate: string | null,
  monthlyContributionTarget: number | null,
  from = new Date()
): PlanningStatus {
  return computeGoalStatus(
    targetAmount,
    currentAmount,
    targetDate,
    monthlyContributionTarget,
    from
  );
}

export function planningStatusLabel(status: PlanningStatus): string {
  return goalStatusLabel(status);
}

export function planningStatusTone(
  status: PlanningStatus
): "default" | "caution" | "attention" {
  switch (status) {
    case "on_track":
      return "default";
    case "gentle_boost":
      return "caution";
    case "adjust_date":
      return "attention";
  }
}

export function goalTypeLabel(type: SavingsGoalType): string {
  switch (type) {
    case "house_deposit":
      return "House deposit";
    case "trip":
      return "Trip / holiday";
    case "emergency_fund":
      return "Emergency fund";
    case "big_purchase":
      return "Big purchase";
    case "debt_payoff":
      return "Debt payoff";
  }
}

export function goalTypeDescription(type: SavingsGoalType): string {
  switch (type) {
    case "house_deposit":
      return "Work toward a home deposit with a clear target and timeline.";
    case "trip":
      return "Save for a trip with destination, dates, and a shared target.";
    case "emergency_fund":
      return "Build a cushion based on your essential monthly costs.";
    case "big_purchase":
      return "Plan for something meaningful — a car, renovation, or gift.";
    case "debt_payoff":
      return "A dedicated payoff plan — coming in a future update.";
  }
}

export function buildPlanningPlan(
  goal: SavingsGoalRow,
  details: SavingsGoalDetailsRow
): PlanningPlan {
  const suggestedMonthly = suggestedMonthlyContribution(
    Number(goal.target_amount),
    Number(goal.current_amount),
    goal.target_date
  );

  return {
    goal,
    details,
    progressPercent: goalProgressPercent(goal),
    suggestedMonthly,
    status: computePlanningStatus(
      Number(goal.target_amount),
      Number(goal.current_amount),
      goal.target_date,
      details.monthly_contribution_target !== null
        ? Number(details.monthly_contribution_target)
        : null
    ),
  };
}
