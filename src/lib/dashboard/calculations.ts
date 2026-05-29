import {
  evaluateManyTransactions,
  toEvidenceInput,
} from "@/lib/evidence";
import type { FinanceMode } from "@/lib/profile/types";
import { showsBusinessFeatures } from "@/lib/profile/types";
import type { TaxHubSummary } from "@/lib/tax/types";
import { buildSelfAssessmentLink } from "@/lib/tax/links";
import { buildDashboardMoneyFlow } from "@/lib/dashboard/money-flow";
import {
  getFlowType,
  shouldCountAsIncome,
  shouldCountInLifestyleSpending,
} from "@/lib/transactions/classification";
import type { TransactionWithRelations } from "@/lib/transactions/types";
import {
  buildPersonalSpendingCategoryLink,
  buildTransactionsFilterLink,
} from "@/lib/transactions/links";
import {
  isTransactionInMonth,
  monthReferenceDate,
  type DashboardMonthContext,
} from "@/lib/dashboard/month-context";
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
import type { BudgetItemWithActual, DashboardBudgetSnapshot } from "@/lib/budget/types";
import type { DashboardSpaceContext } from "@/lib/dashboard/types";
import {
  detectRecurringPayments,
  filterRecurringForMonth,
} from "@/lib/dashboard/recurring";
import { detectSpendingInsights } from "@/lib/dashboard/spending-insights";

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
  if (direction === "income") {
    return rows
      .filter(shouldCountAsIncome)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }
  return rows
    .filter((tx) => !tx.is_business && tx.direction === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

function buildCategorySpending(
  expenses: TransactionWithRelations[]
): DashboardCategorySpend[] {
  const map = new Map<string, DashboardCategorySpend>();

  for (const tx of expenses) {
    if (!shouldCountInLifestyleSpending(tx)) continue;
    const key = tx.category_id ?? "__uncategorized__";
    const categoryName = tx.category?.name ?? "Needs a category";
    const existing = map.get(key);
    const amount = Number(tx.amount);

    if (existing) {
      existing.actualAmount += amount;
    } else {
      map.set(key, {
        categoryId: tx.category_id,
        categoryName,
        actualAmount: amount,
        plannedAmount: null,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.actualAmount - a.actualAmount);
}

/** Merges lifestyle actuals with monthly plan targets for the dashboard. */
export function mergeCategorySpendingWithPlan(
  actualRows: DashboardCategorySpend[],
  budgetItems: BudgetItemWithActual[]
): DashboardCategorySpend[] {
  const plannedByCategoryId = new Map(
    budgetItems.map((item) => [
      item.categoryId,
      { categoryName: item.categoryName, plannedAmount: item.targetAmount },
    ])
  );

  const merged = new Map<string, DashboardCategorySpend>();

  for (const row of actualRows) {
    const key = row.categoryId ?? "__uncategorized__";
    const planned = row.categoryId
      ? (plannedByCategoryId.get(row.categoryId)?.plannedAmount ?? null)
      : null;
    merged.set(key, {
      ...row,
      plannedAmount: planned,
    });
    if (row.categoryId) plannedByCategoryId.delete(row.categoryId);
  }

  for (const [categoryId, planned] of plannedByCategoryId) {
    merged.set(categoryId, {
      categoryId,
      categoryName: planned.categoryName,
      actualAmount: 0,
      plannedAmount: planned.plannedAmount,
    });
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aScore = Math.max(a.actualAmount, a.plannedAmount ?? 0);
    const bScore = Math.max(b.actualAmount, b.plannedAmount ?? 0);
    return bScore - aScore;
  });
}

function buildMonthlyCashflow(
  personalRows: TransactionWithRelations[],
  endYear: number,
  endMonth: number,
  months = 6
): DashboardMonthlyCashflow[] {
  const endDate = new Date(endYear, endMonth - 1, 1);
  const result: DashboardMonthlyCashflow[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const inMonth = personalRows.filter((tx) =>
      isTransactionInMonth(tx.transaction_date, year, month)
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
  transactions: TransactionWithRelations[],
  month: DashboardMonthContext,
  financeMode: FinanceMode
): DashboardPersonalMetrics {
  const personal = transactions.filter(isPersonal);
  const { year, month: monthNumber } = month;

  const thisMonthAll = transactions.filter((tx) =>
    isTransactionInMonth(tx.transaction_date, year, monthNumber)
  );
  const thisMonth = thisMonthAll.filter(isPersonal);
  const thisMonthExpenses = thisMonth.filter(shouldCountInLifestyleSpending);
  const moneyFlow = buildDashboardMoneyFlow(thisMonthAll, financeMode);

  const moneyIn = sumByDirection(thisMonth, "income");
  const moneyOut = sumByDirection(thisMonth, "expense");
  const netCashflow = moneyIn - moneyOut;
  const personalSpending = moneyFlow.personalSpending;
  const savingsRatePercent =
    moneyIn > 0
      ? Math.round(((moneyIn - personalSpending) / moneyIn) * 100)
      : null;

  const spendingByCategory = buildCategorySpending(thisMonthExpenses);
  const uncategorizedInMonth = thisMonthExpenses.filter((tx) => !tx.category_id).length;

  const inputs = thisMonthExpenses.map(toEvidenceInput);
  const evaluations = evaluateManyTransactions(inputs, {
    peerTransactions: inputs,
  });

  const reviewRecommendedTotal = new Set<string>();
  for (const tx of thisMonthExpenses) {
    const flowType = getFlowType(tx);
    if (
      flowType === "savings" ||
      flowType === "investment" ||
      flowType === "debt_repayment" ||
      flowType === "transfer" ||
      flowType === "tax_payment"
    ) {
      continue;
    }
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
    moneyFlow,
    topSpendingCategory: spendingByCategory[0] ?? null,
    reviewRecommendedCount: reviewRecommendedTotal.size,
    uncategorizedCount: uncategorizedInMonth,
    spendingByCategory,
    monthlyCashflow: buildMonthlyCashflow(personal, year, monthNumber),
  };
}

function hasPersonalActivityInMonth(
  transactions: TransactionWithRelations[],
  year: number,
  month: number
): boolean {
  return transactions.some(
    (tx) => !tx.is_business && isTransactionInMonth(tx.transaction_date, year, month)
  );
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
  subscriptionCount: number,
  month: DashboardMonthContext
): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];
  const monthBounds = { from: month.from, to: month.to };
  const monthRef = monthReferenceDate(month.year, month.month);

  if (personal.uncategorizedCount > 0) {
    items.push({
      id: "uncategorized",
      title: "Transactions that need a category",
      description: "Add categories so spending insights stay accurate.",
      count: personal.uncategorizedCount,
      href: buildTransactionsFilterLink(
        { scope: "personal", direction: "expense", category: "uncategorized" },
        monthBounds
      ),
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
      href: buildPersonalSpendingCategoryLink(top.categoryId, monthRef),
    });
  }

  if (subscriptionCount > 0) {
    items.push({
      id: "subscriptions-review",
      title: "Subscriptions to review",
      description:
        "Recurring service charges you may want to keep, change, or cancel.",
      count: subscriptionCount,
      href: buildTransactionsFilterLink(
        { scope: "personal", direction: "expense" },
        monthBounds
      ),
    });
  }

  if (showsBusinessFeatures(financeMode) && business?.summary) {
    const evidenceCount = business.reviewRecommendedCount;
    if (evidenceCount > 0 && taxYearId) {
      items.push({
        id: "evidence-review",
        title: "Business evidence to review",
        description:
          "Some business costs could use a receipt or short note for your records.",
        count: evidenceCount,
        href: `/transactions?scope=business&taxYear=${taxYearId}`,
      });
    }
    if (business.uncategorizedBusinessExpenses > 0 && taxYearId) {
      items.push({
        id: "business-uncategorized",
        title: "Business costs that need a category",
        description: "Assign tax categories for allowable costs.",
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
  budgetItems: BudgetItemWithActual[];
  month: DashboardMonthContext;
}): DashboardData {
  const { month } = input;
  const monthRef = monthReferenceDate(month.year, month.month);
  const personalBase = buildPersonalMetrics(
    input.transactions,
    month,
    input.financeMode
  );
  const spendingByCategory = mergeCategorySpendingWithPlan(
    personalBase.spendingByCategory,
    input.budgetItems
  );
  const personal = {
    ...personalBase,
    spendingByCategory,
    topSpendingCategory: spendingByCategory[0] ?? null,
  };
  const recurringAll = detectRecurringPayments(input.transactions);
  const recurring = filterRecurringForMonth(
    recurringAll,
    input.transactions,
    month.year,
    month.month
  );
  const spendingInsights = detectSpendingInsights(input.transactions, monthRef);
  const hasAnyTransactions =
    !input.spaceContext.isShared &&
    input.transactions.some((tx) => !tx.is_business);
  const hasMonthActivity = hasPersonalActivityInMonth(
    input.transactions,
    month.year,
    month.month
  );
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
        recurring.subscriptionsToReview.length,
        month
      );

  return {
    financeMode: input.financeMode,
    currency: input.currency,
    month,
    hasAnyTransactions,
    hasMonthActivity,
    hasTransactions: hasAnyTransactions,
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
