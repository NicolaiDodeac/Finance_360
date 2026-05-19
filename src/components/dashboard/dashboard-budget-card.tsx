import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { BudgetStatusBadge } from "@/components/budget/budget-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { budgetStatusTone } from "@/lib/budget/calculations";
import type { DashboardBudgetSnapshot } from "@/lib/budget/types";
import { formatMoney } from "@/lib/transactions/format";
import { cn } from "@/lib/utils";

interface DashboardBudgetCardProps {
  snapshot: DashboardBudgetSnapshot;
  currency: string;
}

export function DashboardBudgetCard({
  snapshot,
  currency,
}: DashboardBudgetCardProps) {
  if (!snapshot.hasBudget || !snapshot.summary) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Monthly plan</CardTitle>
          <CardDescription>
            Set gentle category targets and stay aware of your spending this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/budget">
              <Wallet className="mr-2 h-4 w-4" />
              Create your first plan
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary, categoriesAbovePlan, topItem } = snapshot;
  const tone = budgetStatusTone(summary.status);
  const barClass =
    tone === "default"
      ? "bg-emerald-500/80"
      : tone === "caution"
        ? "bg-amber-500/70"
        : "bg-sky-500/70";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Monthly plan</CardTitle>
            <CardDescription>This month&apos;s spending progress</CardDescription>
          </div>
          <BudgetStatusBadge status={summary.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Planned</span>
            <span className="tabular-nums font-medium">
              {formatMoney(summary.totalPlanned, currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent in plan</span>
            <span className="tabular-nums font-medium">
              {formatMoney(summary.totalActual, currency)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", barClass)}
              style={{ width: `${Math.min(100, summary.percentUsed)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.percentUsed}% of plan ·{" "}
            {formatMoney(summary.totalRemaining, currency)} remaining
          </p>
        </div>
        {categoriesAbovePlan.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {categoriesAbovePlan.length} categor
            {categoriesAbovePlan.length === 1 ? "y" : "ies"} worth a gentle look
            {topItem ? ` · ${topItem.categoryName} at ${topItem.percentUsed}%` : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">You are on track this month.</p>
        )}
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/budget">
            View budget
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
