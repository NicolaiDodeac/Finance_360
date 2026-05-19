import Link from "next/link";
import {
  ArrowRight,
  Home,
  Palmtree,
  Shield,
  ShoppingBag,
  Compass,
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
import { formatPlanDate, goalTypeLabel } from "@/lib/planning/calculations";
import type { PlanningPlan } from "@/lib/planning/types";
import { formatMoney } from "@/lib/transactions/format";

interface DashboardPlanningPreviewProps {
  plans: PlanningPlan[];
  currency: string;
}

export function DashboardPlanningPreview({
  plans,
  currency,
}: DashboardPlanningPreviewProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Planning Hub</h2>
          <p className="text-sm text-muted-foreground">
            What your money is working toward — one small step at a time.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/planning">
            <Compass className="mr-2 h-4 w-4" />
            Open Planning Hub
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Start with a purpose</CardTitle>
            <CardDescription>
              Plan a house deposit, trip, emergency fund, or big purchase — linked
              to your savings goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <PreviewChip icon={Home} label="House deposit" />
              <PreviewChip icon={Palmtree} label="Trip" />
              <PreviewChip icon={Shield} label="Emergency fund" />
              <PreviewChip icon={ShoppingBag} label="Big purchase" />
            </div>
            <Button type="button" className="mt-4" size="sm" asChild>
              <Link href="/planning">
                Create your first plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.goal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{plan.goal.name}</CardTitle>
                  <PlanningStatusBadge status={plan.status} />
                </div>
                <CardDescription>
                  {goalTypeLabel(plan.details.goal_type)} · {plan.progressPercent}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="tabular-nums">
                  {formatMoney(plan.goal.current_amount, currency)} of{" "}
                  {formatMoney(plan.goal.target_amount, currency)}
                </p>
                {plan.goal.target_date ? (
                  <p className="text-xs text-muted-foreground">
                    Target {formatPlanDate(plan.goal.target_date)}
                  </p>
                ) : null}
                {plan.suggestedMonthly !== null ? (
                  <p className="text-xs text-muted-foreground">
                    Suggested step: {formatMoney(plan.suggestedMonthly, currency)}/mo
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function PreviewChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-1">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
