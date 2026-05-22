"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkedReceiptDisplayLabel } from "@/lib/receipts/match-link-state";
import type { ReceiptMatchCandidate } from "@/lib/receipts/types";
import {
  formatMoney,
  formatTransactionDate,
} from "@/lib/receipts/format";

interface ReceiptMatchActionsProps {
  match: ReceiptMatchCandidate;
  disabled?: boolean;
  isPending?: boolean;
  onLink: (replaceExistingProof?: boolean) => void;
  onCancel?: () => void;
  linkLabel?: string;
}

export function ReceiptMatchActions({
  match,
  disabled,
  isPending,
  onLink,
  onCancel,
  linkLabel = "Link receipt",
}: ReceiptMatchActionsProps) {
  const tx = match.transaction;

  if (match.linkState === "linked_to_this_receipt") {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
          Already linked
        </p>
        <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90">
          This receipt is already attached to this transaction.
        </p>
        {onCancel ? (
          <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
            Done
          </Button>
        ) : null}
      </div>
    );
  }

  if (match.linkState === "linked_to_other_receipt" && match.linkedReceipt) {
    const proofLabel = linkedReceiptDisplayLabel(match.linkedReceipt);
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-950 dark:text-amber-100">
          This transaction already has proof attached ({proofLabel}). This file
          is a different scan.
        </p>
        <Button
          type="button"
          className="h-12 w-full"
          disabled={disabled || isPending}
          onClick={() => onLink(true)}
        >
          Replace proof with this receipt
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={disabled || isPending}
          onClick={() => onCancel?.()}
        >
          Keep existing proof
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      className="h-12 w-full text-base"
      disabled={disabled || isPending}
      onClick={() => onLink(false)}
    >
      <Check className="h-4 w-4" />
      {isPending ? "Linking…" : linkLabel}
    </Button>
  );
}

export function MatchTransactionCard({ match }: { match: ReceiptMatchCandidate }) {
  const tx = match.transaction;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3 text-sm">
      <p className="font-medium">
        {tx.merchant_name ?? tx.description ?? "Transaction"}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatMoney(Number(tx.amount))} ·{" "}
        {formatTransactionDate(tx.transaction_date)}
        {match.reasons.length > 0 ? ` · ${match.reasons.join(", ")}` : ""}
      </p>
      {match.linkState === "linked_to_other_receipt" && match.linkedReceipt ? (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
          Has proof: {linkedReceiptDisplayLabel(match.linkedReceipt)}
        </p>
      ) : null}
    </div>
  );
}
