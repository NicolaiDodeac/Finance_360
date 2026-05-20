"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { createMonthlyBudget } from "@/lib/budget/actions";
import {
  defaultBudgetName,
  SUGGESTED_BUDGET_CATEGORY_SLUGS,
} from "@/lib/budget/calculations";
import type { BudgetPeriod } from "@/lib/budget/types";
import type { CategoryRow } from "@/lib/categories/queries";
import { getCategoryOptionLabel } from "@/lib/categories/display";

const SUGGESTED_LABELS: Record<string, string> = {
  groceries: "Groceries",
  "eating-out": "Eating out",
  entertainment: "Entertainment",
  transport: "Transport",
  clothing: "Shopping / clothing",
  subscriptions: "Subscriptions",
  fuel: "Fuel",
  utilities: "Utilities",
};

interface BudgetCreatePlanFormProps {
  period: BudgetPeriod;
  expenseCategories: CategoryRow[];
  allCategories: CategoryRow[];
  isFirstPlan?: boolean;
}

export function BudgetCreatePlanForm({
  period,
  expenseCategories,
  allCategories,
  isFirstPlan = false,
}: BudgetCreatePlanFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const slugToCategory = new Map(expenseCategories.map((c) => [c.slug, c]));
  const suggested = SUGGESTED_BUDGET_CATEGORY_SLUGS.filter((slug) =>
    slugToCategory.has(slug)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await createMonthlyBudget(new FormData(e.currentTarget));
    setPending(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

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
            <CardTitle className="text-lg">
              {isFirstPlan ? "Your first monthly plan" : `Plan for ${period.label}`}
            </CardTitle>
            <CardDescription>
              Set gentle spending guides for {period.label}. This is about awareness,
              not restrictions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="name" value={defaultBudgetName(period)} />
          <input type="hidden" name="year" value={period.year} />
          <input type="hidden" name="month" value={period.month} />
          <div className="grid gap-4 sm:grid-cols-2">
            {suggested.map((slug) => (
              <div key={slug} className="space-y-2">
                <Label htmlFor={`target_${slug}`}>
                  {SUGGESTED_LABELS[slug] ?? slug}
                </Label>
                <Input
                  id={`target_${slug}`}
                  name={`target_${slug}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                />
              </div>
            ))}
          </div>
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custom_category_id">Another category</Label>
              <Select id="custom_category_id" name="custom_category_id" defaultValue="">
                <option value="">Choose…</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryOptionLabel(c, allCategories)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom_target_amount">Monthly target (£)</Label>
              <Input
                id="custom_target_amount"
                name="custom_target_amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional"
              />
            </div>
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending
              ? "Creating…"
              : isFirstPlan
                ? "Create monthly plan"
                : `Create plan for ${period.label}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
