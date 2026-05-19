import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PlaceholderCard } from "@/components/shared/placeholder-card";
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
import { createSavingsGoalForm } from "@/lib/goals/actions";
import { goalProgressPercent, type SavingsGoalRow } from "@/lib/goals/types";
import { formatMoney } from "@/lib/transactions/format";

interface GoalsViewProps {
  goals: SavingsGoalRow[];
  spaceId: string;
  spaceName: string;
  isShared: boolean;
  canManage: boolean;
}

export function GoalsView({
  goals,
  spaceId,
  spaceName,
  isShared,
  canManage,
}: GoalsViewProps) {
  const active = goals.filter((g) => !g.is_completed);
  const completed = goals.filter((g) => g.is_completed);

  return (
    <div className="space-y-6">
      {isShared ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">{spaceName}</span> — share
            goals, not everything. Transactions and bank accounts are not shared.
          </p>
        </div>
      ) : null}

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isShared ? "Create a shared goal" : "Create a savings goal"}
            </CardTitle>
            <CardDescription>
              {isShared
                ? "A goal everyone in this space can see and track together."
                : "Name your target and amount. Progress updates as you save."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createSavingsGoalForm}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="space_id" value={spaceId} />
              <div className="flex-1 space-y-2">
                <Label htmlFor="goal-name">Goal name</Label>
                <Input
                  id="goal-name"
                  name="name"
                  placeholder={
                    isShared ? "e.g. House deposit" : "e.g. Emergency fund"
                  }
                  required
                />
              </div>
              <div className="w-full space-y-2 sm:w-40">
                <Label htmlFor="goal-target">Target (£)</Label>
                <Input
                  id="goal-target"
                  name="target_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="5000"
                  required
                />
              </div>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add goal
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <PlaceholderCard
          title="View-only access"
          description="Only space owners and admins can create or edit goals in this shared space."
        />
      )}

      {active.length === 0 ? (
        <PlaceholderCard
          title={isShared ? "No shared goals yet" : "No active goals yet"}
          description={
            canManage
              ? "Create your first goal above, or start from the dashboard."
              : "Goals will appear here when an admin adds them."
          }
        >
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/planning">Open Planning Hub</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </PlaceholderCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((goal) => {
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
                  <p className="text-sm text-muted-foreground">
                    {progress}% complete
                    {goal.target_date
                      ? ` · Target ${new Date(`${goal.target_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isShared
                      ? "Shared monthly contribution — coming soon"
                      : "Suggested monthly contribution — coming soon"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {completed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Completed</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {completed.map((goal) => (
              <Card key={goal.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                  <CardDescription>
                    {formatMoney(goal.target_amount, goal.currency)} reached
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {!isShared ? (
        <PlaceholderCard
          title="Goal reminders & linked accounts"
          description="Automatic contributions and nudges — coming soon."
        />
      ) : null}
    </div>
  );
}
