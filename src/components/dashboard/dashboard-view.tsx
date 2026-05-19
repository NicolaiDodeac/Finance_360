import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  PiggyBank,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { DashboardBudgetCard } from "@/components/dashboard/dashboard-budget-card";
import { DashboardPlanningPreview } from "@/components/dashboard/dashboard-planning-preview";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { SharedSpaceDashboard } from "@/components/dashboard/shared-space-dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSelfAssessmentHref } from "@/lib/dashboard/calculations";
import type { RecurringPayment } from "@/lib/dashboard/recurring";
import type { DashboardData } from "@/lib/dashboard/types";
import { goalMonthlyContributionLine } from "@/lib/goals/calculations";
import { goalProgressPercent } from "@/lib/goals/types";
import { financeModeLabel, showsBusinessFeatures } from "@/lib/profile/types";
import { formatMoney, formatShortDate } from "@/lib/transactions/format";
import { buildPersonalSpendingCategoryLink } from "@/lib/transactions/links";

interface DashboardViewProps {
  data: DashboardData;
  taxYearId: string | null;
}

function RecurringPaymentRow({
  item,
  currency,
}: {
  item: RecurringPayment;
  currency: string;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{item.merchantLabel}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatMoney(item.averageAmount, currency)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {item.frequencyLabel}
        {item.nextExpectedDate
          ? ` · Next around ${formatShortDate(item.nextExpectedDate)}`
          : null}
        {item.categoryName ? ` · ${item.categoryName}` : null}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p
          className={`text-2xl font-semibold tabular-nums ${
            emphasis ? "text-foreground" : ""
          }`}
        >
          {value}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function DashboardView({ data, taxYearId }: DashboardViewProps) {
  if (data.spaceContext.isShared) {
    return <SharedSpaceDashboard data={data} />;
  }

  const { personal, currency, hasTransactions } = data;
  const showBusiness = showsBusinessFeatures(data.financeMode);

  const savingsRateDisplay =
    personal.savingsRatePercent !== null
      ? `${personal.savingsRatePercent}%`
      : "—";

  const topCategoryDisplay = personal.topSpendingCategory
    ? `${personal.topSpendingCategory.categoryName} · ${formatMoney(
        personal.topSpendingCategory.totalAmount,
        currency
      )}`
    : "—";

  const maxCategorySpend = Math.max(
    ...personal.spendingByCategory.map((c) => c.totalAmount),
    1
  );

  const maxMonthlyNet = Math.max(
    ...personal.monthlyCashflow.map((m) => Math.abs(m.net)),
    1
  );

  return (
    <div className="space-y-8">
      {!hasTransactions ? <DashboardEmptyState /> : null}

      {hasTransactions ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          {financeModeLabel(data.financeMode)} · This month at a glance
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Your money</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Money in"
            value={formatMoney(personal.moneyIn, currency)}
            hint="Personal income this month"
          />
          <MetricCard
            label="Money out"
            value={formatMoney(personal.moneyOut, currency)}
            hint="Personal spending this month"
          />
          <MetricCard
            label="Net cashflow"
            value={formatMoney(personal.netCashflow, currency)}
            hint="Income minus expenses"
            emphasis
          />
          <MetricCard
            label="Savings rate"
            value={savingsRateDisplay}
            hint="Share of income left after expenses"
          />
          <MetricCard
            label="Top spending category"
            value={topCategoryDisplay}
            hint="Largest personal expense category"
          />
          <MetricCard
            label="Review recommended"
            value={String(personal.reviewRecommendedCount)}
            hint="Uncategorized or flagged for a quick look"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by category</CardTitle>
            <CardDescription>Personal expenses this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {personal.spendingByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No personal expenses recorded this month yet.
              </p>
            ) : (
              personal.spendingByCategory.slice(0, 6).map((row) => (
                <Link
                  key={row.categoryId ?? row.categoryName}
                  href={buildPersonalSpendingCategoryLink(row.categoryId)}
                  className="block space-y-1 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <div className="flex justify-between text-sm">
                    <span>{row.categoryName}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoney(row.totalAmount, currency)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{
                        width: `${(row.totalAmount / maxCategorySpend) * 100}%`,
                      }}
                    />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly cashflow trend</CardTitle>
            <CardDescription>Personal net over the last six months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {personal.monthlyCashflow.map((month) => (
              <div key={month.monthKey} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{month.label}</span>
                  <span
                    className={`tabular-nums ${
                      month.net >= 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatMoney(month.net, currency)}
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      month.net >= 0 ? "bg-emerald-500/70" : "bg-amber-500/60"
                    }`}
                    style={{
                      width: `${(Math.abs(month.net) / maxMonthlyNet) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardBudgetCard snapshot={data.budget} currency={currency} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Savings goals</CardTitle>
            <CardDescription>Build momentum toward what matters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active goals yet. Create one to see progress here.
              </p>
            ) : (
              data.goals.map((goal) => {
                const progress = goalProgressPercent(goal);
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoney(goal.current_amount, goal.currency)} /{" "}
                        {formatMoney(goal.target_amount, goal.currency)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {goalMonthlyContributionLine(goal, currency, formatMoney)}
                    </p>
                  </div>
                );
              })
            )}
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/goals">
                <PiggyBank className="mr-2 h-4 w-4" />
                {data.goals.length === 0 ? "Create a goal" : "Manage goals"}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recurring payments</CardTitle>
            <CardDescription>
              Regular personal expenses detected from your transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recurring.recurringPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clear recurring patterns yet. They appear after similar charges
                repeat a few times.
              </p>
            ) : (
              data.recurring.recurringPayments.map((item) => (
                <RecurringPaymentRow
                  key={item.merchantKey}
                  item={item}
                  currency={currency}
                />
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {data.recurring.subscriptionsToReview.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Subscriptions to review
          </h2>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Recurring service charges worth a quick check
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recurring.subscriptionsToReview.map((item) => (
                <RecurringPaymentRow
                  key={`sub-${item.merchantKey}`}
                  item={item}
                  currency={currency}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <DashboardPlanningPreview
        plans={data.planningPlans}
        currency={currency}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Needs attention</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.attentionItems.map((item) => (
            <Card
              key={item.id}
              className={item.placeholder ? "border-dashed opacity-90" : undefined}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              {item.count !== undefined && item.href && !item.placeholder ? (
                <CardContent>
                  <Button type="button" variant="link" className="h-auto p-0" asChild>
                    <Link href={item.href}>
                      Review {item.count} item{item.count === 1 ? "" : "s"}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              ) : item.placeholder ? (
                <CardContent>
                  <span className="text-xs font-medium text-muted-foreground">
                    Coming soon
                  </span>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      {showBusiness && data.business ? (
        <section className="space-y-4 rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Business &amp; tax
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional module · {data.business.taxYearLabel ?? "Current tax year"}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/tax">
                <Landmark className="mr-2 h-4 w-4" />
                Open Tax Hub
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Business profit"
              value={formatMoney(data.business.estimatedProfit, currency)}
              hint="Estimated profit this tax year"
            />
            <MetricCard
              label="Suggested tax pot"
              value={formatMoney(data.business.suggestedTaxPot, currency)}
              hint="Planning estimate, not tax advice"
            />
            <MetricCard
              label="Tax readiness"
              value={data.business.taxReadinessLabel}
              hint={data.business.taxReadinessHint}
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Prepare Self Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Step through income, expenses, and review when you are ready to file.
                </p>
                <Button type="button" size="sm" asChild>
                  <Link href={getSelfAssessmentHref(taxYearId)}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Start prep
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {!hasTransactions ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4 shrink-0" />
          <span>
            Your dashboard will fill in as soon as you add transactions. Tax tools stay
            available in the sidebar when you need them.
          </span>
        </div>
      ) : null}
    </div>
  );
}
