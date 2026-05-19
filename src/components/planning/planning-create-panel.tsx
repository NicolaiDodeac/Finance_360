"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Palmtree,
  Shield,
  ShoppingBag,
  CreditCard,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createBigPurchasePlan,
  createEmergencyFundPlan,
  createHouseDepositPlan,
  createTripPlan,
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
  debt_payoff: CreditCard,
};

interface PlanningCreatePanelProps {
  canManage: boolean;
  isShared: boolean;
}

export function PlanningCreatePanel({
  canManage,
  isShared,
}: PlanningCreatePanelProps) {
  const [selected, setSelected] = useState<SavingsGoalType | null>(null);

  if (!canManage) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Start a new plan</h2>
        <p className="text-sm text-muted-foreground">
          {isShared
            ? "Choose what you are saving for together — small steps add up."
            : "Give your savings a purpose. Pick a plan type to begin."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIVE_PLANNING_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type];
          const active = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelected(active ? null : type)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <p className="font-medium">{goalTypeLabel(type)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {goalTypeDescription(type)}
              </p>
            </button>
          );
        })}
        <button
          type="button"
          disabled
          className="rounded-xl border border-dashed p-4 text-left opacity-60"
        >
          <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </span>
          <p className="font-medium">{goalTypeLabel("debt_payoff")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Coming soon — a calm payoff roadmap without the stress.
          </p>
        </button>
      </div>

      {selected ? (
        <PlanForm type={selected} onCancel={() => setSelected(null)} />
      ) : null}
    </section>
  );
}

function PlanForm({
  type,
  onCancel,
}: {
  type: SavingsGoalType;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    let result;

    switch (type) {
      case "house_deposit":
        result = await createHouseDepositPlan(fd);
        break;
      case "trip":
        result = await createTripPlan(fd);
        break;
      case "emergency_fund":
        result = await createEmergencyFundPlan(fd);
        break;
      case "big_purchase":
        result = await createBigPurchasePlan(fd);
        break;
      default:
        result = { success: false, error: "This plan type is not available yet." };
    }

    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    onCancel();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <div>
            <CardTitle className="text-lg">{goalTypeLabel(type)}</CardTitle>
            <CardDescription>
              A few details — we will suggest a gentle monthly step.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "house_deposit" ? <HouseDepositFields /> : null}
          {type === "trip" ? <TripFields /> : null}
          {type === "emergency_fund" ? <EmergencyFundFields /> : null}
          {type === "big_purchase" ? <BigPurchaseFields /> : null}

          <OptionalNotesField />
          <OptionalMonthlyTargetField />

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create plan"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function HouseDepositFields() {
  return (
    <>
      <FieldRow>
        <Field id="hd-name" name="name" label="Plan name (optional)" placeholder="Our first home" />
        <Field
          id="hd-property"
          name="property_price"
          label="Property target price (£)"
          type="number"
          min="1"
          step="1000"
          placeholder="350000"
          required
        />
      </FieldRow>
      <FieldRow>
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
        <Field
          id="hd-current"
          name="current_amount"
          label="Already saved (£)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          required
        />
      </FieldRow>
      <Field
        id="hd-date"
        name="target_date"
        label="Target move date"
        type="date"
        hint="Helps suggest a comfortable monthly step."
      />
    </>
  );
}

function TripFields() {
  return (
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
          placeholder="2500"
          required
        />
        <Field
          id="trip-people"
          name="people_count"
          label="People (optional)"
          type="number"
          min="1"
          step="1"
          placeholder="2"
        />
      </FieldRow>
      <Field
        id="trip-current"
        name="current_amount"
        label="Already saved (£)"
        type="number"
        min="0"
        step="0.01"
        placeholder="0"
        required
      />
    </>
  );
}

function EmergencyFundFields() {
  return (
    <>
      <Field
        id="ef-name"
        name="name"
        label="Plan name (optional)"
        placeholder="Emergency fund"
      />
      <FieldRow>
        <Field
          id="ef-essentials"
          name="monthly_essential_expenses"
          label="Monthly essential expenses (£)"
          type="number"
          min="1"
          step="0.01"
          placeholder="2000"
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
      <FieldRow>
        <Field
          id="ef-current"
          name="current_amount"
          label="Already saved (£)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          required
        />
        <Field id="ef-date" name="target_date" label="Target date (optional)" type="date" />
      </FieldRow>
    </>
  );
}

function BigPurchaseFields() {
  return (
    <>
      <Field
        id="bp-name"
        name="name"
        label="What are you saving for?"
        placeholder="New laptop"
        required
      />
      <FieldRow>
        <Field
          id="bp-target"
          name="target_amount"
          label="Target amount (£)"
          type="number"
          min="1"
          step="0.01"
          required
        />
        <Field
          id="bp-current"
          name="current_amount"
          label="Already saved (£)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          required
        />
      </FieldRow>
      <Field id="bp-date" name="target_date" label="Target date (optional)" type="date" />
    </>
  );
}

function OptionalNotesField() {
  return (
    <div className="space-y-1">
      <Label htmlFor="plan-notes">Notes (optional)</Label>
      <Textarea
        id="plan-notes"
        name="notes"
        rows={2}
        placeholder="A short note to future you…"
      />
    </div>
  );
}

function OptionalMonthlyTargetField() {
  return (
    <Field
      id="plan-monthly"
      name="monthly_contribution_target"
      label="Your monthly step (optional)"
      type="number"
      min="0"
      step="0.01"
      hint="If you already know what feels comfortable each month."
    />
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
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} {...rest} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
