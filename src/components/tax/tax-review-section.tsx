import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildReceiptsLink } from "@/lib/tax/links";
import { formatCount } from "@/lib/tax/format";
import type { TaxReviewItem } from "@/lib/tax/types";

interface TaxReviewSectionProps {
  items: TaxReviewItem[];
}

export function TaxReviewSection({ items }: TaxReviewSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Review needed</CardTitle>
          {items.length > 0 ? (
            <Badge variant="warning">{items.length} to check</Badge>
          ) : null}
        </div>
        <CardDescription>
          Items worth a quick look before you file — not mistakes, just gaps to
          tidy up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <p className="text-sm text-emerald-900 dark:text-emerald-200">
              Nothing flagged for this tax year. Keep strengthening evidence with
              receipts, notes, and HMRC categories as you go.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
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
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          <Link href={buildReceiptsLink()} className="text-primary hover:underline">
            Go to receipts
          </Link>{" "}
          to attach proof to your expenses.
        </p>
      </CardContent>
    </Card>
  );
}
