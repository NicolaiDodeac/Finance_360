import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildTransactionsLink } from "@/lib/tax/links";
import { formatCount, formatMoney } from "@/lib/tax/format";
import type { TaxCategoryBreakdownRow } from "@/lib/tax/types";

interface TaxCategoryBreakdownProps {
  rows: TaxCategoryBreakdownRow[];
  taxYearId: string;
}

export function TaxCategoryBreakdown({
  rows,
  taxYearId,
}: TaxCategoryBreakdownProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense breakdown by HMRC category</CardTitle>
          <CardDescription>
            Categorised business expenses will appear here once you assign HMRC
            categories to your transactions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense breakdown by HMRC category</CardTitle>
        <CardDescription>
          Business expenses grouped by HMRC category for this tax year.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => (
            <li
              key={row.hmrcCategoryId}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{row.categoryName}</p>
                  {!row.isAllowable ? (
                    <Badge variant="muted">Non-allowable</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCount(row.transactionCount, "transaction")} ·{" "}
                  {row.additionalProofCount > 0
                    ? `${formatCount(row.additionalProofCount, "transaction")} may benefit from additional proof`
                    : "Evidence looks supported"}
                </p>
              </div>
              <div className="flex items-center gap-4 sm:shrink-0">
                <p className="text-lg font-semibold tabular-nums">
                  {formatMoney(row.totalAmount)}
                </p>
                <Link
                  href={buildTransactionsLink({
                    taxYearId,
                    direction: "expense",
                  })}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
