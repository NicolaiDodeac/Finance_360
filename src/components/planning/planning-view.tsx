import Link from "next/link";
import { Compass, Users } from "lucide-react";
import { PlanningCreatePanel } from "@/components/planning/planning-create-panel";
import { PlanningPlanCard } from "@/components/planning/planning-plan-card";
import { PlaceholderCard } from "@/components/shared/placeholder-card";
import { Button } from "@/components/ui/button";
import type { PlanningPlan } from "@/lib/planning/types";

interface PlanningViewProps {
  plans: PlanningPlan[];
  spaceName: string;
  isShared: boolean;
  canManage: boolean;
}

export function PlanningView({
  plans,
  spaceName,
  isShared,
  canManage,
}: PlanningViewProps) {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <Compass className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Your money, with a direction
            </p>
            <p className="text-sm text-muted-foreground">
              Planning Hub connects savings to real life — a home, a trip, peace of
              mind. Small steps count; there is no rush and no judgment here.
            </p>
          </div>
        </div>
      </div>

      {isShared ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">{spaceName}</span> —
            house and trip plans work beautifully in a household space. Personal
            spending stays private.
          </p>
        </div>
      ) : null}

      {plans.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Your plans</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <PlanningPlanCard
                key={plan.goal.id}
                plan={plan}
                canManage={canManage}
              />
            ))}
          </div>
        </section>
      ) : (
        <PlaceholderCard
          title="No plans yet"
          description="Choose a plan type below — house deposit, trip, emergency fund, or a big purchase. Each plan links to a savings goal you can track over time."
        >
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/goals">View simple goals</Link>
          </Button>
        </PlaceholderCard>
      )}

      <PlanningCreatePanel canManage={canManage} isShared={isShared} />
    </div>
  );
}
