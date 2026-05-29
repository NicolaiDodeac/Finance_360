"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReceiptPaymentMethod } from "@/types/database";

const OPTIONS = [
  { value: "cash" as const, label: "Cash" },
  { value: "card" as const, label: "Card" },
  { value: "unknown" as const, label: "Other" },
] as const;

interface PaymentMethodPickerProps {
  value: ReceiptPaymentMethod | null;
  onChange: (value: ReceiptPaymentMethod) => void;
  disabled?: boolean;
  className?: string;
}

/** Cash / card / other — same pattern as receipt capture. */
export function PaymentMethodPicker({
  value,
  onChange,
  disabled,
  className,
}: PaymentMethodPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">How did you pay?</Label>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-12 rounded-lg border px-3 text-sm font-medium transition-colors",
              value === opt.value
                ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                : "border-border text-muted-foreground hover:border-muted-foreground/40"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
