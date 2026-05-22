"use client";

import Link from "next/link";
import type { SimilarReceiptInfo } from "@/lib/receipts/duplicate-receipts";
import { formatMoney, formatTransactionDate } from "@/lib/receipts/format";

interface ReceiptSimilarBannerProps {
  similarReceipts: SimilarReceiptInfo[];
  onDeleteCurrent?: () => void;
  deleteDisabled?: boolean;
}

export function ReceiptSimilarBanner({
  similarReceipts,
  onDeleteCurrent,
  deleteDisabled,
}: ReceiptSimilarBannerProps) {
  if (similarReceipts.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/25">
      <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
        {similarReceipts.length === 1
          ? "You already saved a similar receipt"
          : `You already saved ${similarReceipts.length} similar receipts`}
      </p>
      <p className="mt-1 text-xs text-amber-900/85 dark:text-amber-200/85">
        Same amount and date — this may be a duplicate scan. Link to the
        existing transaction below, or delete this copy.
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {similarReceipts.map((item) => (
          <li key={item.receipt.id} className="flex flex-wrap items-center gap-2">
            <span className="text-foreground">
              {item.receipt.merchant_name ?? "Receipt"}
              {item.receipt.total_amount !== null
                ? ` · ${formatMoney(Number(item.receipt.total_amount))}`
                : ""}
              {item.receipt.receipt_date
                ? ` · ${formatTransactionDate(item.receipt.receipt_date)}`
                : ""}
            </span>
            {item.hasLinkedTransaction ? (
              <span className="text-xs text-muted-foreground">
                (linked to a transaction)
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">(not linked)</span>
            )}
            <Link
              href={`/receipts/review/${item.receipt.id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
      {onDeleteCurrent ? (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-destructive hover:underline disabled:opacity-50"
          disabled={deleteDisabled}
          onClick={onDeleteCurrent}
        >
          Delete this duplicate scan
        </button>
      ) : null}
    </section>
  );
}
