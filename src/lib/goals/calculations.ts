import { goalProgressPercent, type SavingsGoalRow } from "@/lib/goals/types";
import type { PlanningStatus } from "@/lib/planning/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AVG_DAYS_PER_MONTH = 30.4375;

export function monthsBetween(from: Date, to: Date): number {
  const diffDays = (to.getTime() - from.getTime()) / MS_PER_DAY;
  return Math.max(0, diffDays / AVG_DAYS_PER_MONTH);
}

export function parseGoalDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function goalRemainingAmount(
  targetAmount: number,
  currentAmount: number
): number {
  return Math.max(0, roundMoney(targetAmount - currentAmount));
}

export function goalRemaining(goal: SavingsGoalRow): number {
  return goalRemainingAmount(
    Number(goal.target_amount),
    Number(goal.current_amount)
  );
}

export function suggestedMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  targetDate: string | null,
  from = new Date()
): number | null {
  const remaining = goalRemainingAmount(targetAmount, currentAmount);
  if (remaining <= 0) return 0;
  if (!targetDate) return null;

  const months = monthsBetween(from, parseGoalDate(targetDate));
  if (months <= 0) return roundMoney(remaining);
  return roundMoney(remaining / months);
}

export function goalSuggestedMonthly(goal: SavingsGoalRow): number | null {
  return suggestedMonthlyContribution(
    Number(goal.target_amount),
    Number(goal.current_amount),
    goal.target_date
  );
}

export function computeGoalStatus(
  targetAmount: number,
  currentAmount: number,
  targetDate: string | null,
  monthlyContributionTarget: number | null = null,
  from = new Date()
): PlanningStatus {
  const remaining = goalRemainingAmount(targetAmount, currentAmount);
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

  const months = monthsBetween(from, parseGoalDate(targetDate));
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

export function goalStatusLabel(status: PlanningStatus): string {
  switch (status) {
    case "on_track":
      return "On track";
    case "gentle_boost":
      return "Needs a gentle boost";
    case "adjust_date":
      return "Target date may need adjusting";
  }
}

export function goalProgress(goal: SavingsGoalRow): number {
  return goalProgressPercent(goal);
}

export function formatGoalDate(isoDate: string): string {
  return parseGoalDate(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface GoalSummary {
  progressPercent: number;
  remaining: number;
  suggestedMonthly: number | null;
  status: PlanningStatus;
  statusLabel: string;
}

export function buildGoalSummary(
  goal: SavingsGoalRow,
  monthlyContributionTarget: number | null = null
): GoalSummary {
  const status = computeGoalStatus(
    Number(goal.target_amount),
    Number(goal.current_amount),
    goal.target_date,
    monthlyContributionTarget
  );

  return {
    progressPercent: goalProgress(goal),
    remaining: goalRemaining(goal),
    suggestedMonthly: goalSuggestedMonthly(goal),
    status,
    statusLabel: goalStatusLabel(status),
  };
}

export function suggestedMonthlyHint(
  suggestedMonthly: number | null,
  hasTargetDate: boolean
): string {
  if (suggestedMonthly !== null) {
    return suggestedMonthly === 0
      ? "Fully funded"
      : "Suggested monthly contribution";
  }
  return hasTargetDate
    ? "Add a target date for a monthly suggestion"
    : "Add a target date to see a monthly suggestion";
}

/** One-line hint for dashboard and list views. */
export function goalMonthlyContributionLine(
  goal: SavingsGoalRow,
  currency: string,
  formatMoneyFn: (amount: number, currency: string) => string
): string {
  const summary = buildGoalSummary(goal);
  if (summary.suggestedMonthly !== null) {
    if (summary.suggestedMonthly === 0) {
      return `${summary.progressPercent}% · Fully funded`;
    }
    return `${summary.progressPercent}% · ${formatMoneyFn(summary.suggestedMonthly, currency)}/mo suggested`;
  }
  return `${summary.progressPercent}% · Add a target date for a monthly suggestion`;
}
