"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadMoreButton } from "@/components/shared/list-pagination-controls";
import { formatCount, formatMoney } from "@/lib/tax/format";
import type { SaLikelyBusinessIncomeItem } from "@/lib/self-assessment/types";
import type { TaxReviewItem } from "@/lib/tax/types";

const REVIEW_BATCH_SIZE = 10;
const INCOME_BATCH_SIZE = 10;

interface SaReviewSectionProps {
  items: TaxReviewItem[];
  likelyBusinessIncome: SaLikelyBusinessIncomeItem[];
}

export function SaReviewSection({
  items,
  likelyBusinessIncome,
}: SaReviewSectionProps) {
  const [visibleReviewCount, setVisibleReviewCount] = useState(REVIEW_BATCH_SIZE);
  const [visibleIncomeCount, setVisibleIncomeCount] = useState(INCOME_BATCH_SIZE);

  const visibleItems = items.slice(0, visibleReviewCount);
  const visibleIncome = likelyBusinessIncome.slice(0, visibleIncomeCount);
  const hasItems = items.length > 0 || likelyBusinessIncome.length > 0;

  return (
    <Card id="step-evidence">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Step 3 — Review before submission</CardTitle>
          {items.length > 0 ? (
            <Badge variant="warning">{items.length} to check</Badge>
          ) : null}
        </div>
        <CardDescription>
          A quick checklist of records worth a look — not mistakes, just gaps to
          tidy up before you copy figures into HMRC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasItems ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <p className="text-sm text-emerald-900 dark:text-emerald-200">
              Nothing flagged for this tax year. You can move on to copy your
              figures when you are ready.
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {visibleItems.map((item) => (
                <ReviewRow key={item.id} item={item} />
              ))}
            </ul>
            <LoadMoreButton
              visibleCount={visibleItems.length}
              totalCount={items.length}
              batchSize={REVIEW_BATCH_SIZE}
              itemLabel="items"
              onLoadMore={() =>
                setVisibleReviewCount((n) => n + REVIEW_BATCH_SIZE)
              }
            />
          </>
        )}

        {likelyBusinessIncome.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Income that may be business
            </p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {visibleIncome.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.merchantName ?? item.description ?? "Income"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matches rule &ldquo;{item.ruleName}&rdquo;
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatMoney(item.amount)}
                  </p>
                </li>
              ))}
            </ul>
            <LoadMoreButton
              visibleCount={visibleIncome.length}
              totalCount={likelyBusinessIncome.length}
              batchSize={INCOME_BATCH_SIZE}
              itemLabel="items"
              onLoadMore={() =>
                setVisibleIncomeCount((n) => n + INCOME_BATCH_SIZE)
              }
            />
            <Link
              href={likelyBusinessIncome[0]?.transactionsLink ?? "/transactions"}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Review income transactions
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReviewRow({ item }: { item: TaxReviewItem }) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatCount(item.count, "transaction")}
        </p>
      </div>
      <Link
        href={item.href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        View transactions
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </li>
  );
}
