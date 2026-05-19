"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Palmtree,
  Shield,
  ShoppingBag,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { PlanningStatusBadge } from "@/components/planning/planning-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildGoalSummary } from "@/lib/goals/calculations";
import { formatPlanDate, goalTypeLabel } from "@/lib/planning/calculations";
import { updatePlanProgress } from "@/lib/planning/actions";
import type { PlanningPlan, SavingsGoalType } from "@/lib/planning/types";
import { formatMoney } from "@/lib/transactions/format";

const TYPE_ICONS: Record<SavingsGoalType, LucideIcon> = {
  house_deposit: Home,
  trip: Palmtree,
  emergency_fund: Shield,
  big_purchase: ShoppingBag,
  debt_payoff: CreditCard,
};

interface PlanningPlanCardProps {
  plan: PlanningPlan;
  canManage: boolean;
}

export function PlanningPlanCard({ plan, canManage }: PlanningPlanCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { goal, details } = plan;
  const Icon = TYPE_ICONS[details.goal_type];
  const currency = goal.currency;

  async function handleProgressSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await updatePlanProgress(new FormData(e.currentTarget));
    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Could not update progress.");
      return;
    }
    router.refresh();
  }

  const summary = buildGoalSummary(
    goal,
    details.monthly_contribution_target !== null
      ? Number(details.monthly_contribution_target)
      : null
  );

  const contributionDisplay =
    details.monthly_contribution_target !== null
      ? formatMoney(details.monthly_contribution_target, currency)
      : summary.suggestedMonthly !== null
        ? formatMoney(summary.suggestedMonthly, currency)
        : "Add a target date for a monthly suggestion";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <div>
              <CardTitle className="text-base">{goal.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {goalTypeLabel(details.goal_type)}
              </p>
            </div>
          </div>
          <PlanningStatusBadge status={plan.status} />
        </div>
        <CardDescription>
          {formatMoney(goal.current_amount, currency)} saved of{" "}
          {formatMoney(goal.target_amount, currency)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{plan.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${plan.progressPercent}%` }}
            />
          </div>
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {goal.target_date ? (
            <div>
              <dt className="text-muted-foreground">Target date</dt>
              <dd className="font-medium">{formatPlanDate(goal.target_date)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Small step each month</dt>
            <dd className="font-medium tabular-nums">{contributionDisplay}</dd>
          </div>
          {details.destination ? (
            <div>
              <dt className="text-muted-foreground">Destination</dt>
              <dd className="font-medium">{details.destination}</dd>
            </div>
          ) : null}
          {details.people_count ? (
            <div>
              <dt className="text-muted-foreground">Travellers</dt>
              <dd className="font-medium">{details.people_count}</dd>
            </div>
          ) : null}
          {details.deposit_percent !== null && details.estimated_total_cost ? (
            <>
              <div>
                <dt className="text-muted-foreground">Property target</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(details.estimated_total_cost, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Deposit</dt>
                <dd className="font-medium">{details.deposit_percent}%</dd>
              </div>
            </>
          ) : null}
          {details.monthly_essential_expenses !== null &&
          details.target_months_cover !== null ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Peace-of-mind target</dt>
              <dd className="font-medium">
                {details.target_months_cover} months of essentials (
                {formatMoney(details.monthly_essential_expenses, currency)}/mo)
              </dd>
            </div>
          ) : null}
        </dl>

        {details.notes ? (
          <p className="text-sm text-muted-foreground">{details.notes}</p>
        ) : null}

        {canManage ? (
          <form
            onSubmit={handleProgressSubmit}
            className="flex flex-wrap items-end gap-3 border-t pt-4"
          >
            <input type="hidden" name="goal_id" value={goal.id} />
            <div className="min-w-[10rem] flex-1 space-y-1">
              <Label htmlFor={`current-${goal.id}`}>Update saved so far</Label>
              <Input
                id={`current-${goal.id}`}
                name="current_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={Number(goal.current_amount)}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Update progress"}
            </Button>
            {error ? (
              <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
