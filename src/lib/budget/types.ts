import type { DashboardMonthContext } from "@/lib/dashboard/month-context";
import type { Database } from "@/types/database";

export type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
export type BudgetItemRow = Database["public"]["Tables"]["budget_items"]["Row"];

export type BudgetStatus = "on_track" | "slightly_above" | "review_recommended";

export interface BudgetItemWithActual {
  id: string;
  categoryId: string;
  categoryName: string;
  targetAmount: number;
  actualAmount: number;
  remaining: number;
  percentUsed: number;
  warningThreshold: number | null;
  status: BudgetStatus;
}

export interface BudgetPeriod {
  year: number;
  month: number;
  label: string;
}

export interface BudgetSummary {
  totalPlanned: number;
  totalActual: number;
  totalRemaining: number;
  percentUsed: number;
  status: BudgetStatus;
}

export interface BudgetCashflowSummary {
  moneyIn: number;
  moneyOut: number;
  net: number;
}

export interface BudgetSavingsSummary {
  plannedToGoals: number;
  goalCount: number;
  activeGoalProgressPercent: number | null;
}

export interface BudgetPageData {
  period: BudgetPeriod;
  month: DashboardMonthContext;
  budget: BudgetRow | null;
  items: BudgetItemWithActual[];
  summary: BudgetSummary | null;
  cashflow: BudgetCashflowSummary;
  savings: BudgetSavingsSummary;
  topSpendingCategories: { categoryId: string | null; categoryName: string; totalAmount: number }[];
  categoriesAbovePlan: BudgetItemWithActual[];
  currency: string;
  isShared: boolean;
  spaceName: string;
  canManage: boolean;
  hasTransactions: boolean;
}

export interface DashboardBudgetSnapshot {
  hasBudget: boolean;
  summary: BudgetSummary | null;
  categoriesAbovePlan: Pick<BudgetItemWithActual, "categoryId" | "categoryName" | "percentUsed" | "status">[];
  topItem: Pick<BudgetItemWithActual, "categoryName" | "percentUsed" | "status"> | null;
}
