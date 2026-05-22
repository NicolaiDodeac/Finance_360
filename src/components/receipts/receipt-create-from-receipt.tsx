"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTransactionFromReceipt } from "@/lib/receipts/capture-actions";
import type { ReceiptTransactionKind } from "@/lib/receipts/types";

interface ReceiptCreateFromReceiptProps {
  receiptId: string;
  onCreated?: () => void;
}

const KIND_OPTIONS: {
  kind: ReceiptTransactionKind;
  label: string;
  description: string;
}[] = [
  {
    kind: "cash_expense",
    label: "Cash expense",
    description: "Paid in cash — recorded on your Cash / Manual account.",
  },
  {
    kind: "card_manual_expense",
    label: "Card / manual expense",
    description: "Paid by card or entered manually.",
  },
  {
    kind: "cash_income",
    label: "Cash income",
    description: "Cash received — personal income.",
  },
  {
    kind: "business_income",
    label: "Business income",
    description: "Income for your self-employed records.",
  },
];

export function ReceiptCreateFromReceipt({
  receiptId,
  onCreated,
}: ReceiptCreateFromReceiptProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] =
    useState<ReceiptTransactionKind>("cash_expense");

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createTransactionFromReceipt(receiptId, {
        kind: selectedKind,
      });
      if (!result.success) {
        setError(result.error ?? "Could not create transaction.");
        return;
      }
      onCreated?.();
      router.push("/receipts");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">Create from receipt</h4>
        <p className="text-xs text-muted-foreground">
          No matching transaction yet. Choose how to record this — categories
          and HMRC mappings apply as usual.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {KIND_OPTIONS.map((option) => (
          <li key={option.kind}>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-border bg-card px-3 py-3 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
              <input
                type="radio"
                name="tx-kind"
                value={option.kind}
                checked={selectedKind === option.kind}
                disabled={isPending}
                onChange={() => setSelectedKind(option.kind)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        className="w-full"
        disabled={isPending}
        onClick={handleCreate}
      >
        {isPending ? "Creating…" : "Create and link transaction"}
      </Button>
    </div>
  );
}
