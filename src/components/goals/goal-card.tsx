"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { GoalAddPlanningDialog } from "@/components/goals/goal-add-planning-dialog";
import { GoalProgressForm } from "@/components/goals/goal-progress-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildGoalSummary, formatGoalDate } from "@/lib/goals/calculations";
import type { SavingsGoalWithMeta } from "@/lib/goals/queries";
import { formatMoney } from "@/lib/transactions/format";

interface GoalCardProps {
  goal: SavingsGoalWithMeta;
  canManage: boolean;
  showPlanningLink?: boolean;
}

export function GoalCard({
  goal,
  canManage,
  showPlanningLink = true,
}: GoalCardProps) {
  const [planningOpen, setPlanningOpen] = useState(false);
  const summary = buildGoalSummary(goal);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{goal.name}</CardTitle>
          <CardDescription>
            {formatMoney(goal.current_amount, goal.currency)} of{" "}
            {formatMoney(goal.target_amount, goal.currency)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${summary.progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {summary.progressPercent}% complete
            {goal.target_date
              ? ` · Target ${formatGoalDate(goal.target_date)}`
              : ""}
          </p>
          {summary.suggestedMonthly !== null ? (
            <p className="text-xs text-muted-foreground">
              {summary.suggestedMonthly === 0
                ? "Fully funded"
                : `Suggested monthly: ${formatMoney(summary.suggestedMonthly, goal.currency)}`}
            </p>
          ) : !goal.target_date ? (
            <p className="text-xs text-muted-foreground">
              Add a target date to see a monthly suggestion
            </p>
          ) : null}

          {goal.hasPlanningDetails && showPlanningLink ? (
            <Button type="button" variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href="/planning">
                <Compass className="mr-1 h-3 w-3" />
                View in Planning Hub
              </Link>
            </Button>
          ) : null}

          {!goal.hasPlanningDetails && canManage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPlanningOpen(true)}
            >
              Add planning details
            </Button>
          ) : null}

          {canManage ? (
            <GoalProgressForm
              goalId={goal.id}
              currentAmount={Number(goal.current_amount)}
            />
          ) : null}
        </CardContent>
      </Card>

      {!goal.hasPlanningDetails ? (
        <GoalAddPlanningDialog
          goal={goal}
          open={planningOpen}
          onOpenChange={setPlanningOpen}
        />
      ) : null}
    </>
  );
}
