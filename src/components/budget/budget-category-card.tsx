import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BudgetStatusBadge } from "@/components/budget/budget-status-badge";
import { budgetStatusTone } from "@/lib/budget/calculations";
import type { BudgetItemWithActual } from "@/lib/budget/types";
import { formatMoney } from "@/lib/transactions/format";
import { cn } from "@/lib/utils";

const barTone: Record<ReturnType<typeof budgetStatusTone>, string> = {
  default: "bg-emerald-500/80",
  caution: "bg-amber-500/70",
  attention: "bg-sky-500/70",
};

interface BudgetCategoryCardProps {
  item: BudgetItemWithActual;
  currency: string;
}

export function BudgetCategoryCard({ item, currency }: BudgetCategoryCardProps) {
  const tone = budgetStatusTone(item.status);
  const barWidth = Math.min(100, item.percentUsed);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{item.categoryName}</CardTitle>
            <CardDescription>
              {formatMoney(item.actualAmount, currency)} of{" "}
              {formatMoney(item.targetAmount, currency)} planned
            </CardDescription>
          </div>
          <BudgetStatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", barTone[tone])}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{item.percentUsed}% of plan</span>
          <span>{formatMoney(item.remaining, currency)} remaining</span>
        </div>
      </CardContent>
    </Card>
  );
}
