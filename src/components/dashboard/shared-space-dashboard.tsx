import Link from "next/link";
import { PiggyBank, Users } from "lucide-react";
import { DashboardBudgetCard } from "@/components/dashboard/dashboard-budget-card";
import { DashboardPlanningPreview } from "@/components/dashboard/dashboard-planning-preview";
import { PlaceholderCard } from "@/components/shared/placeholder-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";
import { goalMonthlyContributionLine } from "@/lib/goals/calculations";
import { goalProgressPercent } from "@/lib/goals/types";
import { formatMoney } from "@/lib/transactions/format";

interface SharedSpaceDashboardProps {
  data: DashboardData;
}

export function SharedSpaceDashboard({ data }: SharedSpaceDashboardProps) {
  const { space } = data.spaceContext;
  const { currency, goals } = data;

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const overallProgress =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">{space.name}</p>
            <p className="text-sm text-muted-foreground">
              Share goals, not everything. Personal transactions and bank accounts
              stay in your private space.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Shared progress</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active shared goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{goals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saved together
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(totalSaved, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatMoney(totalTarget, currency)} across active goals
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Shared monthly contribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">—</p>
              <p className="text-xs text-muted-foreground">
                Suggested split per person — coming soon
              </p>
            </CardContent>
          </Card>
        </div>
        {goals.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Overall goal progress</CardTitle>
              <CardDescription>{overallProgress}% across shared goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Household monthly plan</h2>
        <DashboardBudgetCard snapshot={data.budget} currency={currency} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Shared savings goals</h2>
        {goals.length === 0 ? (
          <PlaceholderCard
            title="No shared goals yet"
            description="Create a goal in this space to plan together — deposits, trips, or your emergency fund."
          >
            {space.canManage ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/planning">Start a shared plan</Link>
              </Button>
            ) : null}
          </PlaceholderCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal) => {
              const progress = goalProgressPercent(goal);
              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{goal.name}</CardTitle>
                    <CardDescription>
                      {formatMoney(goal.current_amount, goal.currency)} of{" "}
                      {formatMoney(goal.target_amount, goal.currency)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {goalMonthlyContributionLine(goal, currency, formatMoney)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/goals">
            <PiggyBank className="mr-2 h-4 w-4" />
            Manage shared goals
          </Link>
        </Button>
      </section>

      <DashboardPlanningPreview
        plans={data.planningPlans}
        currency={currency}
      />
    </div>
  );
}
