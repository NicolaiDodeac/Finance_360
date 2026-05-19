import { goalProgressPercent, type SavingsGoalRow } from "@/lib/goals/types";
import type {
  PlanningPlan,
  PlanningStatus,
  SavingsGoalDetailsRow,
  SavingsGoalType,
} from "@/lib/planning/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AVG_DAYS_PER_MONTH = 30.4375;

export function monthsBetween(from: Date, to: Date): number {
  const diffDays = (to.getTime() - from.getTime()) / MS_PER_DAY;
  return Math.max(0, diffDays / AVG_DAYS_PER_MONTH);
}

export function parsePlanDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

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

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function suggestedMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  targetDate: string | null,
  from = new Date()
): number | null {
  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining <= 0) return 0;
  if (!targetDate) return null;

  const months = monthsBetween(from, parsePlanDate(targetDate));
  if (months <= 0) return roundMoney(remaining);
  return roundMoney(remaining / months);
}

export function computePlanningStatus(
  targetAmount: number,
  currentAmount: number,
  targetDate: string | null,
  monthlyContributionTarget: number | null,
  from = new Date()
): PlanningStatus {
  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining <= 0) return "on_track";

  const suggested = suggestedMonthlyContribution(
    targetAmount,
    currentAmount,
    targetDate,
    from
  );

  if (!targetDate) {
    if (
      monthlyContributionTarget !== null &&
      monthlyContributionTarget > 0 &&
      monthlyContributionTarget * 12 >= remaining
    ) {
      return "on_track";
    }
    return "gentle_boost";
  }

  const months = monthsBetween(from, parsePlanDate(targetDate));
  if (months <= 0) return "adjust_date";

  const requiredPace = remaining / months;
  const actualPace =
    monthlyContributionTarget !== null && monthlyContributionTarget > 0
      ? monthlyContributionTarget
      : suggested ?? requiredPace;

  if (actualPace >= requiredPace * 0.92) return "on_track";
  if (actualPace >= requiredPace * 0.65) return "gentle_boost";
  return "adjust_date";
}

export function planningStatusLabel(status: PlanningStatus): string {
  switch (status) {
    case "on_track":
      return "On track";
    case "gentle_boost":
      return "Needs a gentle boost";
    case "adjust_date":
      return "Target date may need adjusting";
  }
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

export function formatPlanDate(isoDate: string): string {
  return parsePlanDate(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
