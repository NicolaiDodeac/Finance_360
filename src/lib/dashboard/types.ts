import type { FinanceMode } from "@/lib/profile/types";
import type { TaxHubSummary } from "@/lib/tax/types";
import type { SavingsGoalRow } from "@/lib/goals/types";
import type { PlanningPlan } from "@/lib/planning/types";
import type { DashboardBudgetSnapshot } from "@/lib/budget/types";
import type { UserSpace } from "@/lib/spaces/types";
import type { DashboardMonthContext } from "@/lib/dashboard/month-context";
import type { RecurringInsights } from "@/lib/dashboard/recurring";
import type { SpendingInsights } from "@/lib/dashboard/spending-insights";

export interface DashboardCategorySpend {
  categoryId: string | null;
  categoryName: string;
  actualAmount: number;
  /** Monthly plan target when a budget exists for this category; otherwise null. */
  plannedAmount: number | null;
}

export interface DashboardMonthlyCashflow {
  monthKey: string;
  label: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
}

export interface DashboardMoneyFlow {
  /** Personal income (always populated). */
  income: number;
  personalSpending: number;
  businessIncome: number;
  businessExpenses: number;
  savedOrInvested: number;
  debtRepaid: number;
  taxPaid: number;
  transfersExcluded: number;
  showBusinessBreakdown: boolean;
}

export interface DashboardPersonalMetrics {
  moneyIn: number;
  moneyOut: number;
  netCashflow: number;
  savingsRatePercent: number | null;
  moneyFlow: DashboardMoneyFlow;
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
  month: DashboardMonthContext;
  /** User has imported transactions at any time. */
  hasAnyTransactions: boolean;
  /** Personal activity exists in the selected month. */
  hasMonthActivity: boolean;
  /** @deprecated Use hasAnyTransactions — kept for gradual migration. */
  hasTransactions: boolean;
  personal: DashboardPersonalMetrics;
  business: DashboardBusinessSnapshot | null;
  goals: SavingsGoalRow[];
  planningPlans: PlanningPlan[];
  attentionItems: DashboardAttentionItem[];
  recurring: RecurringInsights;
  spendingInsights: SpendingInsights;
  taxYearId: string | null;
  spaceContext: DashboardSpaceContext;
  budget: DashboardBudgetSnapshot;
}
