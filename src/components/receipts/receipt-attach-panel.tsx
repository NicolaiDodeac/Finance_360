"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  attachReceiptToTransaction,
  getReceiptMatchCandidates,
} from "@/lib/receipts/actions";
import {
  formatMoney,
  formatTransactionDate,
} from "@/lib/receipts/format";
import type {
  ReceiptMatchCandidate,
  ReceiptWithRelations,
} from "@/lib/receipts/types";

interface ReceiptAttachPanelProps {
  receipt: ReceiptWithRelations;
  onAttached?: () => void;
}

export function ReceiptAttachPanel({
  receipt,
  onAttached,
}: ReceiptAttachPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<ReceiptMatchCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCandidates(true);

    getReceiptMatchCandidates(receipt.id).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setCandidates(result.data);
      }
      setLoadingCandidates(false);
    });

    return () => {
      cancelled = true;
    };
  }, [receipt.id]);

  const filtered = candidates.filter((item) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    const label = [
      item.transaction.merchant_name,
      item.transaction.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return label.includes(term);
  });

  function handleAttach(transactionId: string) {
    setError(null);
    startTransition(async () => {
      const result = await attachReceiptToTransaction(receipt.id, transactionId);
      if (!result.success) {
        setError(result.error ?? "Could not link receipt.");
        return;
      }
      onAttached?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">
          Link to a transaction
        </h4>
        <p className="text-xs text-muted-foreground">
          Likely matches are shown first — business expenses without proof
          attached.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="tx-match-search" className="text-xs text-muted-foreground">
          Search transactions
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="tx-match-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Merchant or description"
            className="pl-9"
            disabled={isPending}
          />
        </div>
      </div>

      {loadingCandidates ? (
        <p className="text-sm text-muted-foreground">Finding likely matches…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No matching business expenses found. Add or mark transactions as
          business first.
        </p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {filtered.map((item) => (
            <li
              key={item.transaction.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {item.transaction.merchant_name ??
                    item.transaction.description ??
                    "Transaction"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(Number(item.transaction.amount))} ·{" "}
                  {formatTransactionDate(item.transaction.transaction_date)}
                  {item.reasons.length > 0
                    ? ` · ${item.reasons.join(", ")}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleAttach(item.transaction.id)}
              >
                Link
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
