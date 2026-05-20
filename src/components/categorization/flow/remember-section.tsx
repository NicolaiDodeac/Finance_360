"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RuleScope } from "@/lib/categorization/categorise-flow";
import { merchantDisplayName } from "@/lib/categorization/categorise-flow";

interface RememberSectionProps {
  merchantLabel: string;
  rememberEnabled: boolean;
  onRememberChange: (value: boolean) => void;
  ruleScope: RuleScope;
  onRuleScopeChange: (scope: RuleScope) => void;
  isAmbiguous: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

const RULE_SCOPE_OPTIONS: { value: RuleScope; label: string }[] = [
  {
    value: "group_only",
    label: "Similar imported transactions (this group only)",
  },
  { value: "future_similar", label: "Future similar transactions" },
  { value: "transaction_only", label: "This group only — do not remember" },
];

export function RememberSection({
  merchantLabel,
  rememberEnabled,
  onRememberChange,
  ruleScope,
  onRuleScopeChange,
  isAmbiguous,
  disabled,
  hidden,
}: RememberSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const shortName = merchantDisplayName(merchantLabel);

  if (hidden) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Remember this choice</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Finance 360 will use this for similar{" "}
          <span className="font-medium text-foreground">{shortName}</span>{" "}
          transactions next time.
        </p>
      </div>

      {isAmbiguous && (
        <p className="text-sm text-amber-900 dark:text-amber-100">
          This merchant can mean different things, so we won&apos;t remember
          automatically unless you choose to.
        </p>
      )}

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Remember this choice</span>
        <button
          type="button"
          role="switch"
          aria-checked={rememberEnabled}
          disabled={disabled}
          onClick={() => onRememberChange(!rememberEnabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            rememberEnabled ? "bg-primary" : "bg-muted"
          } ${disabled ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              rememberEnabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </label>

      <button
        type="button"
        className="text-xs text-primary underline-offset-2 hover:underline"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? "Hide rule behaviour" : "Change rule behaviour"}
      </button>

      {showAdvanced && (
        <div className="space-y-2 border-t border-border pt-3">
          <Label htmlFor="rule-scope" className="text-xs font-medium">
            Apply to
          </Label>
          <Select
            id="rule-scope"
            value={ruleScope}
            disabled={disabled}
            onChange={(e) => onRuleScopeChange(e.target.value as RuleScope)}
            className="text-sm"
          >
            {RULE_SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Future similar transactions creates a saved merchant rule. Group-only
            applies here without remembering.
          </p>
        </div>
      )}
    </div>
  );
}
