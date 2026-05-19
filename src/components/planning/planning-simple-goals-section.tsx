"use client";

import { useState } from "react";
import { GoalAddPlanningDialog } from "@/components/goals/goal-add-planning-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildGoalSummary, formatGoalDate } from "@/lib/goals/calculations";
import type { SavingsGoalRow } from "@/lib/goals/types";
import { formatMoney } from "@/lib/transactions/format";

interface PlanningSimpleGoalsSectionProps {
  goals: SavingsGoalRow[];
  canManage: boolean;
}

export function PlanningSimpleGoalsSection({
  goals,
  canManage,
}: PlanningSimpleGoalsSectionProps) {
  if (goals.length === 0) return null;

  return (
    <section className="space-y-4 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Goals without planning details
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Simple savings goals from your Goals page. Add context to turn them into
          full plans.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <SimpleGoalRow key={goal.id} goal={goal} canManage={canManage} />
        ))}
      </div>
    </section>
  );
}

function SimpleGoalRow({
  goal,
  canManage,
}: {
  goal: SavingsGoalRow;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const summary = buildGoalSummary(goal);

  return (
    <>
      <Card className="border-border/60 bg-background/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{goal.name}</CardTitle>
          <CardDescription>
            {formatMoney(goal.current_amount, goal.currency)} of{" "}
            {formatMoney(goal.target_amount, goal.currency)} · {summary.progressPercent}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {goal.target_date ? (
            <p className="text-xs text-muted-foreground">
              Target {formatGoalDate(goal.target_date)}
            </p>
          ) : null}
          {canManage ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
              Add details
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {canManage ? (
        <GoalAddPlanningDialog goal={goal} open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
