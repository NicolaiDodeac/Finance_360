import type { FinanceMode } from "@/lib/profile/types";
import type { TaxHubSummary } from "@/lib/tax/types";
import type { SavingsGoalRow } from "@/lib/goals/types";
import type { PlanningPlan } from "@/lib/planning/types";
import type { DashboardBudgetSnapshot } from "@/lib/budget/types";
import type { UserSpace } from "@/lib/spaces/types";

export interface DashboardCategorySpend {
  categoryId: string | null;
  categoryName: string;
  totalAmount: number;
}

export interface DashboardMonthlyCashflow {
  monthKey: string;
  label: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
}

export interface DashboardPersonalMetrics {
  moneyIn: number;
  moneyOut: number;
  netCashflow: number;
  savingsRatePercent: number | null;
  topSpendingCategory: DashboardCategorySpend | null;
  reviewRecommendedCount: number;
  uncategorizedCount: number;
  spendingByCategory: DashboardCategorySpend[];
  monthlyCashflow: DashboardMonthlyCashflow[];
}

export interface DashboardAttentionItem {
  id: string;
  title: string;
  description: string;
  count?: number;
  href?: string;
  placeholder?: boolean;
}

export interface DashboardBusinessSnapshot {
  estimatedProfit: number;
  suggestedTaxPot: number;
  taxReadinessLabel: string;
  taxReadinessHint: string;
  uncategorizedBusinessExpenses: number;
  reviewRecommendedCount: number;
  summary: TaxHubSummary | null;
  taxYearLabel: string | null;
}

export interface DashboardSpaceContext {
  space: UserSpace;
  isShared: boolean;
}

export interface DashboardData {
  financeMode: FinanceMode;
  currency: string;
  hasTransactions: boolean;
  personal: DashboardPersonalMetrics;
  business: DashboardBusinessSnapshot | null;
  goals: SavingsGoalRow[];
  planningPlans: PlanningPlan[];
  attentionItems: DashboardAttentionItem[];
  taxYearId: string | null;
  spaceContext: DashboardSpaceContext;
  budget: DashboardBudgetSnapshot;
}
