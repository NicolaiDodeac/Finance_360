"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Palmtree,
  Shield,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SavingsGoalRow } from "@/lib/goals/types";
import {
  enrichBigPurchaseGoal,
  enrichEmergencyFundGoal,
  enrichHouseDepositGoal,
  enrichTripGoal,
} from "@/lib/planning/actions";
import { goalTypeDescription, goalTypeLabel } from "@/lib/planning/calculations";
import type { SavingsGoalType } from "@/lib/planning/types";
import { ACTIVE_PLANNING_TYPES } from "@/lib/planning/types";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<SavingsGoalType, LucideIcon> = {
  house_deposit: Home,
  trip: Palmtree,
  emergency_fund: Shield,
  big_purchase: ShoppingBag,
  debt_payoff: ShoppingBag,
};

interface GoalAddPlanningDialogProps {
  goal: SavingsGoalRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel?: string;
}

export function GoalAddPlanningDialog({
  goal,
  open,
  onOpenChange,
}: GoalAddPlanningDialogProps) {
  const [selected, setSelected] = useState<SavingsGoalType | null>(null);

  function handleClose(next: boolean) {
    if (!next) setSelected(null);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add planning details</DialogTitle>
          <DialogDescription>
            Turn &ldquo;{goal.name}&rdquo; into a plan with context — timeline,
            monthly steps, and a clearer path forward.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIVE_PLANNING_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelected(type)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <p className="text-sm font-medium">{goalTypeLabel(type)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {goalTypeDescription(type)}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <EnrichPlanForm
            goal={goal}
            type={selected}
            onBack={() => setSelected(null)}
            onSuccess={() => handleClose(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EnrichPlanForm({
  goal,
  type,
  onBack,
  onSuccess,
}: {
  goal: SavingsGoalRow;
  type: SavingsGoalType;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("goal_id", goal.id);

    let result;
    switch (type) {
      case "house_deposit":
        result = await enrichHouseDepositGoal(fd);
        break;
      case "trip":
        result = await enrichTripGoal(fd);
        break;
      case "emergency_fund":
        result = await enrichEmergencyFundGoal(fd);
        break;
      case "big_purchase":
        result = await enrichBigPurchaseGoal(fd);
        break;
      default:
        result = { success: false, error: "This plan type is not available yet." };
    }

    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    onSuccess();
    router.refresh();
  }

  const currentSaved = Number(goal.current_amount);
  const targetAmount = Number(goal.target_amount);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium">{goalTypeLabel(type)}</p>

      {type === "house_deposit" ? (
        <>
          <FieldRow>
            <Field
              id="hd-property"
              name="property_price"
              label="Property target price (£)"
              type="number"
              min="1"
              step="1000"
              required
            />
            <Field
              id="hd-deposit"
              name="deposit_percent"
              label="Deposit (%)"
              type="number"
              min="1"
              max="100"
              step="0.5"
              placeholder="10"
              required
            />
          </FieldRow>
          <Field
            id="hd-date"
            name="target_date"
            label="Target move date"
            type="date"
            defaultValue={goal.target_date ?? undefined}
            hint="Helps suggest a comfortable monthly step."
          />
        </>
      ) : null}

      {type === "trip" ? (
        <>
          <FieldRow>
            <Field
              id="trip-dest"
              name="destination"
              label="Destination"
              placeholder="Lisbon"
              required
            />
            <Field
              id="trip-date"
              name="travel_date"
              label="Travel date"
              type="date"
              defaultValue={goal.target_date ?? undefined}
            />
          </FieldRow>
          <FieldRow>
            <Field
              id="trip-cost"
              name="estimated_cost"
              label="Estimated trip cost (£)"
              type="number"
              min="1"
              step="0.01"
              defaultValue={targetAmount}
              required
            />
            <Field
              id="trip-people"
              name="people_count"
              label="People (optional)"
              type="number"
              min="1"
              step="1"
            />
          </FieldRow>
        </>
      ) : null}

      {type === "emergency_fund" ? (
        <FieldRow>
          <Field
            id="ef-essentials"
            name="monthly_essential_expenses"
            label="Monthly essential expenses (£)"
            type="number"
            min="1"
            step="0.01"
            required
            hint="Rent, bills, food — what you truly need each month."
          />
          <Field
            id="ef-months"
            name="target_months_cover"
            label="Months of cover"
            type="number"
            min="1"
            max="24"
            step="0.5"
            placeholder="3"
            required
          />
        </FieldRow>
      ) : null}

      {type === "big_purchase" ? (
        <FieldRow>
          <Field
            id="bp-target"
            name="target_amount"
            label="Target amount (£)"
            type="number"
            min="1"
            step="0.01"
            defaultValue={targetAmount}
            required
          />
          <Field
            id="bp-date"
            name="target_date"
            label="Target date (optional)"
            type="date"
            defaultValue={goal.target_date ?? undefined}
          />
        </FieldRow>
      ) : null}

      <input type="hidden" name="current_amount" value={currentSaved} />

      <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        Already saved: £{currentSaved.toLocaleString("en-GB")}
      </div>

      <div className="space-y-1">
        <Label htmlFor="enrich-notes">Notes (optional)</Label>
        <Textarea id="enrich-notes" name="notes" rows={2} />
      </div>

      <Field
        id="enrich-monthly"
        name="monthly_contribution_target"
        label="Your monthly step (optional)"
        type="number"
        min="0"
        step="0.01"
        hint="If you already know what feels comfortable each month."
      />

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add details"}
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </form>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  id,
  name,
  label,
  type = "text",
  hint,
  defaultValue,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  hint?: string;
  defaultValue?: number | string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        {...rest}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
