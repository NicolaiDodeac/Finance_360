"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  formatMoney,
  formatShortDate,
  signedAmount,
} from "@/lib/transactions/format";
import {
  getAppliedRuleName,
  isUncategorized,
  needsHmrcCategory,
} from "@/lib/transactions/form";
import { EvidenceBadge } from "@/components/evidence/evidence-badge";
import type { EvidenceEvaluation } from "@/lib/evidence/types";
import type { TransactionWithRelations } from "@/lib/transactions/types";

interface TransactionItemProps {
  transaction: TransactionWithRelations;
  evidence?: EvidenceEvaluation;
  onSelect: (transaction: TransactionWithRelations) => void;
}

export function TransactionItem({
  transaction,
  evidence,
  onSelect,
}: TransactionItemProps) {
  const uncategorized = isUncategorized(transaction);
  const missingHmrc = needsHmrcCategory(transaction);
  const appliedRuleName = getAppliedRuleName(transaction);
  const signed = signedAmount(
    Number(transaction.amount),
    transaction.direction
  );
  const title =
    transaction.description?.trim() ||
    transaction.merchant_name?.trim() ||
    "Untitled transaction";
  const subtitle = transaction.merchant_name?.trim() || transaction.account?.name;

  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className={cn(
        "group flex w-full items-start gap-4 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:items-center",
        uncategorized &&
          "border-amber-100/80 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10"
      )}
    >
      <div className="hidden w-14 shrink-0 text-sm text-muted-foreground sm:block">
        {formatShortDate(transaction.transaction_date)}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{title}</p>
          {transaction.is_business && (
            <Badge variant="business">Business</Badge>
          )}
          {missingHmrc && (
            <Badge variant="warning">HMRC needed</Badge>
          )}
          {uncategorized && (
            <Badge variant="uncategorized">Uncategorized</Badge>
          )}
          {appliedRuleName && (
            <Badge variant="secondary" title="Category assigned by your rule">
              Auto
            </Badge>
          )}
          {evidence ? (
            <EvidenceBadge evaluation={evidence} compact />
          ) : null}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          <span className="sm:hidden">
            {formatShortDate(transaction.transaction_date)}
            {" · "}
          </span>
          {subtitle}
          {transaction.category?.name && (
            <>
              {" · "}
              <span>{transaction.category.name}</span>
            </>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "font-semibold tabular-nums",
            transaction.direction === "income" && "text-emerald-700 dark:text-emerald-400",
            transaction.direction === "transfer" && "text-muted-foreground"
          )}
        >
          {signed >= 0 ? "+" : ""}
          {formatMoney(Math.abs(signed), transaction.currency)}
        </p>
        <p className="text-xs capitalize text-muted-foreground">
          {transaction.direction}
        </p>
      </div>
    </button>
  );
}
