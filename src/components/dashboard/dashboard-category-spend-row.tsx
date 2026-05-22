import Link from "next/link";
import type { DashboardCategorySpend } from "@/lib/dashboard/types";
import { formatMoney } from "@/lib/transactions/format";
import { cn } from "@/lib/utils";

interface DashboardCategorySpendRowProps {
  row: DashboardCategorySpend;
  currency: string;
  href: string;
  maxActualScale: number;
}

export function DashboardCategorySpendRow({
  row,
  currency,
  href,
  maxActualScale,
}: DashboardCategorySpendRowProps) {
  const hasPlan = row.plannedAmount != null && row.plannedAmount > 0;
  const overPlan = hasPlan && row.actualAmount > row.plannedAmount!;
  const barPercent = hasPlan
    ? Math.min(100, (row.actualAmount / row.plannedAmount!) * 100)
    : maxActualScale > 0
      ? (row.actualAmount / maxActualScale) * 100
      : 0;

  return (
    <Link
      href={href}
      className="block rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium">{row.categoryName}</span>
        <span className="shrink-0 text-right text-xs tabular-nums">
          <span className="text-foreground">{formatMoney(row.actualAmount, currency)}</span>
          {hasPlan ? (
            <span className="text-muted-foreground">
              {" "}
              / {formatMoney(row.plannedAmount!, currency)}
            </span>
          ) : (
            <span className="text-muted-foreground"> · no plan</span>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            overPlan ? "bg-amber-500/75" : "bg-primary/65"
          )}
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </Link>
  );
}
