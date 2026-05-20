import type { CategoryRow } from "@/lib/categories/queries";
import { getCategoryOptionLabel } from "@/lib/categories/display";
import type { SavingsGoalRow } from "@/lib/goals/types";
import type { DashboardMonthContext } from "@/lib/dashboard/month-context";
import type {
  BudgetCashflowSummary,
  BudgetItemRow,
  BudgetItemWithActual,
  BudgetPageData,
  BudgetPeriod,
  BudgetRow,
  BudgetSavingsSummary,
  BudgetStatus,
  BudgetSummary,
  DashboardBudgetSnapshot,
} from "@/lib/budget/types";
import {
  shouldCountAsIncome,
  shouldCountInBudget,
} from "@/lib/transactions/classification";
import type { TransactionWithRelations } from "@/lib/transactions/types";

const DEFAULT_WARNING_THRESHOLD = 0.85;
const SLIGHTLY_ABOVE_CAP = 1.15;

export function getCurrentPeriod(date = new Date()): BudgetPeriod {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return {
    year,
    month,
    label: new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, 1)),
  };
}

export function defaultBudgetName(period: BudgetPeriod): string {
  return `${period.label} plan`;
}

export function computeBudgetStatus(
  actual: number,
  target: number,
  warningThreshold: number | null
): BudgetStatus {
  if (target <= 0) return "on_track";

  const ratio = actual / target;
  const softLimit = warningThreshold ?? DEFAULT_WARNING_THRESHOLD;

  if (ratio <= softLimit) return "on_track";
  if (ratio <= SLIGHTLY_ABOVE_CAP) return "slightly_above";
  return "review_recommended";
}

export function budgetStatusLabel(status: BudgetStatus): string {
  switch (status) {
    case "on_track":
      return "On track";
    case "slightly_above":
      return "Slightly above plan";
    case "review_recommended":
      return "Review recommended";
  }
}

export function budgetStatusTone(
  status: BudgetStatus
): "default" | "caution" | "attention" {
  switch (status) {
    case "on_track":
      return "default";
    case "slightly_above":
      return "caution";
    case "review_recommended":
      return "attention";
  }
}

function isInMonth(isoDate: string, year: number, month: number): boolean {
  const [y, m] = isoDate.split("-").map(Number);
  return y === year && m === month;
}

function sumByDirection(
  rows: TransactionWithRelations[],
  direction: "income" | "expense"
): number {
  if (direction === "income") {
    return rows
      .filter(shouldCountAsIncome)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }
  return rows
    .filter((tx) => !tx.is_business && tx.direction === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

function buildActualsByCategory(
  transactions: TransactionWithRelations[],
  year: number,
  month: number
): Map<string, number> {
  const map = new Map<string, number>();

  for (const tx of transactions) {
    if (!shouldCountInBudget(tx)) continue;
    if (!isInMonth(tx.transaction_date, year, month)) continue;
    if (!tx.category_id) continue;

    map.set(tx.category_id, (map.get(tx.category_id) ?? 0) + Number(tx.amount));
  }

  return map;
}

function buildTopSpending(
  transactions: TransactionWithRelations[],
  categories: CategoryRow[],
  year: number,
  month: number
) {
  const actuals = buildActualsByCategory(transactions, year, month);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return Array.from(actuals.entries())
    .map(([categoryId, totalAmount]) => {
      const category = categoryById.get(categoryId);
      return {
        categoryId,
        categoryName: category
          ? getCategoryOptionLabel(category, categories)
          : "Unknown",
        totalAmount,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 6);
}

export function buildBudgetItems(
  budgetItems: BudgetItemRow[],
  categories: CategoryRow[],
  actualsByCategory: Map<string, number>
): BudgetItemWithActual[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return budgetItems
    .map((item) => {
      const category = categoryById.get(item.category_id);
      const targetAmount = Number(item.target_amount);
      const actualAmount = actualsByCategory.get(item.category_id) ?? 0;
      const remaining = Math.max(0, targetAmount - actualAmount);
      const percentUsed =
        targetAmount > 0 ? Math.round((actualAmount / targetAmount) * 100) : 0;
      const warningThreshold = item.warning_threshold
        ? Number(item.warning_threshold)
        : null;

      return {
        id: item.id,
        categoryId: item.category_id,
        categoryName: category
          ? getCategoryOptionLabel(category, categories)
          : "Unknown",
        targetAmount,
        actualAmount,
        remaining,
        percentUsed,
        warningThreshold,
        status: computeBudgetStatus(actualAmount, targetAmount, warningThreshold),
      };
    })
    .sort((a, b) => b.actualAmount - a.actualAmount);
}

export function buildBudgetSummary(items: BudgetItemWithActual[]): BudgetSummary {
  const totalPlanned = items.reduce((s, i) => s + i.targetAmount, 0);
  const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);
  const totalRemaining = Math.max(0, totalPlanned - totalActual);
  const percentUsed =
    totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

  return {
    totalPlanned,
    totalActual,
    totalRemaining,
    percentUsed,
    status: computeBudgetStatus(totalActual, totalPlanned, null),
  };
}

function buildCashflow(
  transactions: TransactionWithRelations[],
  year: number,
  month: number
): BudgetCashflowSummary {
  const personal = transactions.filter((tx) => !tx.is_business);
  const inMonth = personal.filter((tx) =>
    isInMonth(tx.transaction_date, year, month)
  );
  const moneyIn = sumByDirection(inMonth, "income");
  const moneyOut = sumByDirection(inMonth, "expense");

  return { moneyIn, moneyOut, net: moneyIn - moneyOut };
}

function buildSavingsSummary(goals: SavingsGoalRow[]): BudgetSavingsSummary {
  if (goals.length === 0) {
    return {
      plannedToGoals: 0,
      goalCount: 0,
      activeGoalProgressPercent: null,
    };
  }

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const progress =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : null;

  return {
    plannedToGoals: totalTarget,
    goalCount: goals.length,
    activeGoalProgressPercent: progress,
  };
}

export function buildBudgetPageData(input: {
  period: BudgetPeriod;
  month: DashboardMonthContext;
  budget: BudgetRow | null;
  budgetItems: BudgetItemRow[];
  categories: CategoryRow[];
  transactions: TransactionWithRelations[];
  goals: SavingsGoalRow[];
  currency: string;
  isShared: boolean;
  spaceName: string;
  canManage: boolean;
}): BudgetPageData {
  const { period, budget, budgetItems, categories, transactions, goals } = input;
  const actualsByCategory = buildActualsByCategory(
    transactions,
    period.year,
    period.month
  );
  const items = buildBudgetItems(budgetItems, categories, actualsByCategory);
  const summary = items.length > 0 ? buildBudgetSummary(items) : null;
  const categoriesAbovePlan = items.filter(
    (i) => i.status === "slightly_above" || i.status === "review_recommended"
  );

  return {
    period,
    month: input.month,
    budget,
    items,
    summary,
    cashflow: buildCashflow(transactions, period.year, period.month),
    savings: buildSavingsSummary(goals),
    topSpendingCategories: buildTopSpending(
      transactions,
      categories,
      period.year,
      period.month
    ),
    categoriesAbovePlan,
    currency: input.currency,
    isShared: input.isShared,
    spaceName: input.spaceName,
    canManage: input.canManage,
    hasTransactions: transactions.some((tx) => !tx.is_business),
  };
}

export function buildDashboardBudgetSnapshot(
  data: Pick<BudgetPageData, "summary" | "items" | "budget">
): DashboardBudgetSnapshot {
  if (!data.budget || !data.summary) {
    return {
      hasBudget: false,
      summary: null,
      categoriesAbovePlan: [],
      topItem: null,
    };
  }

  const categoriesAbovePlan = data.items
    .filter(
      (i) => i.status === "slightly_above" || i.status === "review_recommended"
    )
    .map((i) => ({
      categoryId: i.categoryId,
      categoryName: i.categoryName,
      percentUsed: i.percentUsed,
      status: i.status,
    }));

  const topItem = categoriesAbovePlan[0]
    ? {
        categoryName: categoriesAbovePlan[0].categoryName,
        percentUsed: categoriesAbovePlan[0].percentUsed,
        status: categoriesAbovePlan[0].status,
      }
    : data.items[0]
      ? {
          categoryName: data.items[0].categoryName,
          percentUsed: data.items[0].percentUsed,
          status: data.items[0].status,
        }
      : null;

  return {
    hasBudget: true,
    summary: data.summary,
    categoriesAbovePlan,
    topItem,
  };
}

/** Suggested expense category slugs for first monthly plan. */
export const SUGGESTED_BUDGET_CATEGORY_SLUGS = [
  "groceries",
  "eating-out",
  "entertainment",
  "transport",
  "clothing",
  "subscriptions",
  "fuel",
  "utilities",
] as const;
