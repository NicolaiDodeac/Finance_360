"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PlainChoice } from "@/lib/categorization/categorise-flow/types";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";

interface CategoryChoiceSelectProps {
  id: string;
  label: string;
  choices: PlainChoice[];
  value: CategoryChoiceId | null;
  onChange: (id: CategoryChoiceId | null) => void;
  disabled?: boolean;
  hint?: string;
}

export function CategoryChoiceSelect({
  id,
  label,
  choices,
  value,
  onChange,
  disabled,
  hint,
}: CategoryChoiceSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <Select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) =>
          onChange((e.target.value || null) as CategoryChoiceId | null)
        }
      >
        <option value="">Choose category…</option>
        {choices.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
