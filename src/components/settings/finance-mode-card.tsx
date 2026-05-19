"use client";

import { useTransition } from "react";
import { updateFinanceMode } from "@/lib/profile/actions";
import type { FinanceMode } from "@/lib/profile/types";
import { financeModeLabel } from "@/lib/profile/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const MODE_OPTIONS: { value: FinanceMode; description: string }[] = [
  {
    value: "personal",
    description: "Focus on spending, savings, and personal money clarity.",
  },
  {
    value: "self_employed",
    description: "Business profit, tax pot, and Self Assessment tools on the dashboard.",
  },
  {
    value: "both",
    description: "Personal command center first, with a business & tax section below.",
  },
];

interface FinanceModeCardProps {
  currentMode: FinanceMode;
}

export function FinanceModeCard({ currentMode }: FinanceModeCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      await updateFinanceMode(value as FinanceMode);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How you use Finance 360</CardTitle>
        <CardDescription>
          Choose what appears on your dashboard. You can change this anytime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="finance-mode">Finance mode</Label>
          <Select
            id="finance-mode"
            value={currentMode}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isPending}
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {financeModeLabel(option.value)}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {MODE_OPTIONS.find((o) => o.value === currentMode)?.description}
        </p>
      </CardContent>
    </Card>
  );
}
