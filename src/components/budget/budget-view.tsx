import Link from "next/link";
import { ArrowRight, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { BudgetCategoryCard } from "@/components/budget/budget-category-card";
import { BudgetCreatePlanForm } from "@/components/budget/budget-create-plan-form";
import { BudgetStatusBadge } from "@/components/budget/budget-status-badge";
import { PlaceholderCard } from "@/components/shared/placeholder-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { budgetStatusTone } from "@/lib/budget/calculations";
import type { BudgetPageData } from "@/lib/budget/types";
import type { CategoryRow } from "@/lib/categories/queries";
import { formatMoney } from "@/lib/transactions/format";
import { cn } from "@/lib/utils";

interface BudgetViewProps {
  data: BudgetPageData;
  expenseCategories: CategoryRow[];
  allCategories: CategoryRow[];
}

function SummaryMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function BudgetView({ data, expenseCategories, allCategories }: BudgetViewProps) {
  const {
    period,
    budget,
    items,
    summary,
    cashflow,
    savings,
    topSpendingCategories,
    categoriesAbovePlan,
    currency,
    isShared,
    spaceName,
    canManage,
    hasTransactions,
  } = data;

  if (!budget) {
    return (
      <div className="space-y-6">
        {canManage ? (
          <BudgetCreatePlanForm
            period={period}
            expenseCategories={expenseCategories}
            allCategories={allCategories}
            isFirstPlan={data.month.isCurrentMonth}
          />
        ) : isShared ? (
          <PlaceholderCard
            title="Household plans"
            description={`When an admin creates a plan in ${spaceName}, everyone in the space can see progress. Spending shown reflects your own transactions for now.`}
          />
        ) : (
          <PlaceholderCard
            title="View-only"
            description="Only space owners and admins can create a monthly plan."
          />
        )}
      </div>
    );
  }

  const summaryTone = summary ? budgetStatusTone(summary.status) : "default";
  const summaryBarClass =
    summaryTone === "default"
      ? "bg-emerald-500/80"
      : summaryTone === "caution"
        ? "bg-amber-500/70"
        : "bg-sky-500/70";

  return (
    <div className="space-y-8">
      {isShared ? (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{spaceName}</span> — shared
          plan. Spending reflects your transactions; household totals are coming later.
        </p>
      ) : null}

      {summary ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{budget.name}</h2>
              <p className="text-sm text-muted-foreground">{period.label}</p>
            </div>
            <BudgetStatusBadge status={summary.status} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric
              label="Planned"
              value={formatMoney(summary.totalPlanned, currency)}
              hint="Monthly targets combined"
            />
            <SummaryMetric
              label="Actual"
              value={formatMoney(summary.totalActual, currency)}
              hint="Personal spending in plan categories"
            />
            <SummaryMetric
              label="Remaining"
              value={formatMoney(summary.totalRemaining, currency)}
              hint="Room left in your plan"
            />
            <SummaryMetric
              label="Plan used"
              value={`${summary.percentUsed}%`}
              hint="Across categories with targets"
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", summaryBarClass)}
                  style={{ width: `${Math.min(100, summary.percentUsed)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly cashflow</CardTitle>
            <CardDescription>Personal money in and out in {period.label}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Money in</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatMoney(cashflow.moneyIn, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Money out</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatMoney(cashflow.moneyOut, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net</p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  cashflow.net >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}
              >
                {formatMoney(cashflow.net, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Savings allocation</CardTitle>
            <CardDescription>Active goals in this space</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {savings.goalCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active goals yet. Connect your plan to what you are building toward.
              </p>
            ) : (
              <>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatMoney(savings.plannedToGoals, currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Combined target across {savings.goalCount} goal
                  {savings.goalCount === 1 ? "" : "s"}
                  {savings.activeGoalProgressPercent !== null
                    ? ` · ${savings.activeGoalProgressPercent}% saved so far`
                    : ""}
                </p>
              </>
            )}
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/goals">
                <PiggyBank className="mr-2 h-4 w-4" />
                Manage goals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {categoriesAbovePlan.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Worth a gentle look
          </h2>
          <p className="text-sm text-muted-foreground">
            These categories are slightly above your plan — a good moment to review,
            not a setback.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {categoriesAbovePlan.map((item) => (
              <BudgetCategoryCard key={item.id} item={item} currency={currency} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">By category</h2>
        {!hasTransactions && items.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            <Wallet className="mr-1 inline h-4 w-4" />
            Add transactions to see actual spending against your plan.
          </p>
        ) : null}
        {items.length === 0 ? (
          <PlaceholderCard
            title="No category targets yet"
            description="Add targets to categories to track planned vs actual."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <BudgetCategoryCard key={item.id} item={item} currency={currency} />
            ))}
          </div>
        )}
      </section>

      {topSpendingCategories.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Top spending in {period.label}
          </h2>
          <Card>
            <CardContent className="space-y-3 pt-6">
              {topSpendingCategories.map((row) => (
                <div
                  key={row.categoryId ?? row.categoryName}
                  className="flex justify-between text-sm"
                >
                  <span>{row.categoryName}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(row.totalAmount, currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
        <span>
          Plans are guides for awareness. Adjust anytime as life changes.
        </span>
        <Button type="button" variant="link" className="h-auto p-0" asChild>
          <Link href="/transactions">
            Review transactions
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
