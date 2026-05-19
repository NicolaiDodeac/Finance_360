import {
  evaluateManyTransactions,
  toEvidenceInput,
} from "@/lib/evidence";
import type { FinanceMode } from "@/lib/profile/types";
import { showsBusinessFeatures } from "@/lib/profile/types";
import type { TaxHubSummary } from "@/lib/tax/types";
import { buildSelfAssessmentLink } from "@/lib/tax/links";
import type { TransactionWithRelations } from "@/lib/transactions/types";
import { buildPersonalSpendingCategoryLink } from "@/lib/transactions/links";
import type { SpendingInsights } from "@/lib/dashboard/spending-insights";
import type {
  DashboardAttentionItem,
  DashboardBusinessSnapshot,
  DashboardCategorySpend,
  DashboardData,
  DashboardMonthlyCashflow,
  DashboardPersonalMetrics,
} from "@/lib/dashboard/types";
import type { SavingsGoalRow } from "@/lib/goals/types";
import type { PlanningPlan } from "@/lib/planning/types";
import type { DashboardBudgetSnapshot } from "@/lib/budget/types";
import type { DashboardSpaceContext } from "@/lib/dashboard/types";
import { detectRecurringPayments } from "@/lib/dashboard/recurring";
import { detectSpendingInsights } from "@/lib/dashboard/spending-insights";

function isInMonth(isoDate: string, year: number, month: number): boolean {
  const [y, m] = isoDate.split("-").map(Number);
  return y === year && m === month;
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(
    date
  );
}

function isPersonal(tx: TransactionWithRelations): boolean {
  return !tx.is_business;
}

function sumByDirection(
  rows: TransactionWithRelations[],
  direction: "income" | "expense"
): number {
  return rows
    .filter((tx) => tx.direction === direction)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

function buildCategorySpending(
  expenses: TransactionWithRelations[]
): DashboardCategorySpend[] {
  const map = new Map<string, DashboardCategorySpend>();

  for (const tx of expenses) {
    const key = tx.category_id ?? "__uncategorized__";
    const categoryName = tx.category?.name ?? "Uncategorized";
    const existing = map.get(key);
    const amount = Number(tx.amount);

    if (existing) {
      existing.totalAmount += amount;
    } else {
      map.set(key, {
        categoryId: tx.category_id,
        categoryName,
        totalAmount: amount,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

function buildMonthlyCashflow(
  personalRows: TransactionWithRelations[],
  months = 6
): DashboardMonthlyCashflow[] {
  const now = new Date();
  const result: DashboardMonthlyCashflow[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const inMonth = personalRows.filter((tx) =>
      isInMonth(tx.transaction_date, year, month)
    );
    const moneyIn = sumByDirection(inMonth, "income");
    const moneyOut = sumByDirection(inMonth, "expense");

    result.push({
      monthKey: monthKey(year, month),
      label: monthLabel(year, month),
      moneyIn,
      moneyOut,
      net: moneyIn - moneyOut,
    });
  }

  return result;
}

function buildPersonalMetrics(
  transactions: TransactionWithRelations[]
): DashboardPersonalMetrics {
  const personal = transactions.filter(isPersonal);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const thisMonth = personal.filter((tx) =>
    isInMonth(tx.transaction_date, year, month)
  );
  const thisMonthExpenses = thisMonth.filter((tx) => tx.direction === "expense");

  const moneyIn = sumByDirection(thisMonth, "income");
  const moneyOut = sumByDirection(thisMonth, "expense");
  const netCashflow = moneyIn - moneyOut;
  const savingsRatePercent =
    moneyIn > 0 ? Math.round((netCashflow / moneyIn) * 100) : null;

  const spendingByCategory = buildCategorySpending(thisMonthExpenses);
  const uncategorizedExpenseAllTime = personal.filter(
    (tx) => tx.direction === "expense" && !tx.category_id
  ).length;

  const inputs = thisMonthExpenses.map(toEvidenceInput);
  const evaluations = evaluateManyTransactions(inputs, {
    peerTransactions: inputs,
  });

  const reviewRecommendedTotal = new Set<string>();
  for (const tx of thisMonthExpenses) {
    if (!tx.category_id) {
      reviewRecommendedTotal.add(tx.id);
    }
    if (evaluations.get(tx.id)?.level === "review_recommended") {
      reviewRecommendedTotal.add(tx.id);
    }
  }

  return {
    moneyIn,
    moneyOut,
    netCashflow,
    savingsRatePercent,
    topSpendingCategory: spendingByCategory[0] ?? null,
    reviewRecommendedCount: reviewRecommendedTotal.size,
    uncategorizedCount: uncategorizedExpenseAllTime,
    spendingByCategory,
    monthlyCashflow: buildMonthlyCashflow(personal),
  };
}

function buildTaxReadiness(summary: TaxHubSummary | null): {
  label: string;
  hint: string;
} {
  if (!summary?.hasBusinessActivity) {
    return {
      label: "Getting started",
      hint: "Add business income or expenses to track tax readiness.",
    };
  }

  const { metrics } = summary;
  const issues =
    metrics.uncategorizedBusinessExpensesCount +
    metrics.evidenceConfidence.reviewRecommended;

  if (issues === 0) {
    return {
      label: "Looking good",
      hint: "Your business records are categorized and evidence is in reasonable shape.",
    };
  }
  if (issues <= 5) {
    return {
      label: "Almost there",
      hint: "A few items could use categories or supporting proof.",
    };
  }
  return {
    label: "Needs attention",
    hint: "Review uncategorized expenses and evidence before filing.",
  };
}

function buildBusinessSnapshot(
  summary: TaxHubSummary | null,
  taxYearLabel: string | null
): DashboardBusinessSnapshot | null {
  if (!summary) {
    return {
      estimatedProfit: 0,
      suggestedTaxPot: 0,
      taxReadinessLabel: "No tax year",
      taxReadinessHint: "Set up a tax year in Settings to track business totals.",
      uncategorizedBusinessExpenses: 0,
      reviewRecommendedCount: 0,
      summary: null,
      taxYearLabel,
    };
  }

  const readiness = buildTaxReadiness(summary);

  return {
    estimatedProfit: summary.metrics.estimatedProfit,
    suggestedTaxPot: summary.metrics.suggestedTaxPot,
    taxReadinessLabel: readiness.label,
    taxReadinessHint: readiness.hint,
    uncategorizedBusinessExpenses:
      summary.metrics.uncategorizedBusinessExpensesCount,
    reviewRecommendedCount: summary.metrics.evidenceConfidence.reviewRecommended,
    summary,
    taxYearLabel,
  };
}

function buildAttentionItems(
  financeMode: FinanceMode,
  personal: DashboardPersonalMetrics,
  business: DashboardBusinessSnapshot | null,
  taxYearId: string | null,
  spendingInsights: SpendingInsights,
  subscriptionCount: number
): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];

  if (personal.uncategorizedCount > 0) {
    items.push({
      id: "uncategorized",
      title: "Uncategorized transactions",
      description: "Add categories so spending insights stay accurate.",
      count: personal.uncategorizedCount,
      href: "/transactions?scope=personal",
    });
  }

  if (spendingInsights.worthALook.length > 0) {
    const top = spendingInsights.worthALook[0];
    items.push({
      id: "category-spending-review",
      title: "Category spending worth a look",
      description:
        spendingInsights.worthALook.length === 1
          ? `${top.categoryName} is a bit higher than your usual pattern this month.`
          : "A few categories are a bit higher than your usual pattern this month.",
      count: spendingInsights.worthALook.length,
      href: buildPersonalSpendingCategoryLink(top.categoryId),
    });
  }

  if (subscriptionCount > 0) {
    items.push({
      id: "subscriptions-review",
      title: "Subscriptions to review",
      description:
        "Recurring service charges you may want to keep, change, or cancel.",
      count: subscriptionCount,
      href: "/transactions?scope=personal&direction=expense",
    });
  }

  if (showsBusinessFeatures(financeMode) && business?.summary) {
    const evidenceCount = business.reviewRecommendedCount;
    if (evidenceCount > 0 && taxYearId) {
      items.push({
        id: "evidence-review",
        title: "Business evidence to review",
        description:
          "Some business expenses could use a receipt or short note for your records.",
        count: evidenceCount,
        href: `/transactions?scope=business&taxYear=${taxYearId}`,
      });
    }
    if (business.uncategorizedBusinessExpenses > 0 && taxYearId) {
      items.push({
        id: "business-uncategorized",
        title: "Uncategorized business expenses",
        description: "Assign HMRC categories for allowable costs.",
        count: business.uncategorizedBusinessExpenses,
        href: `/transactions?scope=business&taxYear=${taxYearId}`,
      });
    }
  }

  return items;
}

export function buildDashboardData(input: {
  financeMode: FinanceMode;
  currency: string;
  transactions: TransactionWithRelations[];
  taxSummary: TaxHubSummary | null;
  taxYearLabel: string | null;
  taxYearId: string | null;
  goals: SavingsGoalRow[];
  planningPlans: PlanningPlan[];
  spaceContext: DashboardSpaceContext;
  budgetSnapshot: DashboardBudgetSnapshot;
}): DashboardData {
  const personal = buildPersonalMetrics(input.transactions);
  const recurring = detectRecurringPayments(input.transactions);
  const spendingInsights = detectSpendingInsights(input.transactions);
  const { isShared } = input.spaceContext;
  const showBusiness =
    !isShared && showsBusinessFeatures(input.financeMode);
  const business = showBusiness
    ? buildBusinessSnapshot(input.taxSummary, input.taxYearLabel)
    : null;

  const emptyRecurring = {
    recurringPayments: [],
    subscriptionsToReview: [],
  };
  const emptySpendingInsights = { worthALook: [] };

  const attentionItems = isShared
    ? [
        {
          id: "shared-privacy",
          title: "Your personal transactions stay private",
          description:
            "Only shared goals appear here. Bank accounts and spending are not shared in this space.",
          placeholder: true,
        },
      ]
    : buildAttentionItems(
        input.financeMode,
        personal,
        business,
        input.taxYearId,
        spendingInsights,
        recurring.subscriptionsToReview.length
      );

  return {
    financeMode: input.financeMode,
    currency: input.currency,
    hasTransactions: !isShared && input.transactions.length > 0,
    personal,
    business,
    goals: input.goals,
    planningPlans: input.planningPlans,
    attentionItems,
    recurring: isShared ? emptyRecurring : recurring,
    spendingInsights: isShared ? emptySpendingInsights : spendingInsights,
    taxYearId: input.taxYearId,
    spaceContext: input.spaceContext,
    budget: input.budgetSnapshot,
  };
}

export function getSelfAssessmentHref(taxYearId: string | null): string {
  if (!taxYearId) return "/tax/self-assessment";
  return buildSelfAssessmentLink(taxYearId);
}
