import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvidenceLevelLabel } from "@/lib/evidence/labels";
import { buildTransactionsLink } from "@/lib/tax/links";
import { formatCount } from "@/lib/tax/format";
import type { EvidenceConfidenceCounts } from "@/lib/evidence/types";

interface TaxEvidenceSummaryProps {
  counts: EvidenceConfidenceCounts;
  taxYearId: string;
}

const LEVEL_ROWS = [
  { key: "high" as const, countKey: "high" as const },
  { key: "medium" as const, countKey: "medium" as const },
  { key: "review_recommended" as const, countKey: "reviewRecommended" as const },
];

export function TaxEvidenceSummary({ counts, taxYearId }: TaxEvidenceSummaryProps) {
  const mayBenefitCount = counts.low + counts.reviewRecommended;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Transactions that may benefit from additional proof
        </CardTitle>
        <CardDescription>
          Evidence confidence for business transactions this tax year — based on
          receipts, bank records, categories, and context. Not a pass or fail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVEL_ROWS.map(({ key, countKey }) => {
            const label = getEvidenceLevelLabel(key);
            const count = counts[countKey];
            return (
              <div
                key={key}
                className="rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <p className="text-2xl font-semibold tabular-nums">{count}</p>
                <p className="text-sm font-medium text-foreground">{label.short}</p>
                <p className="text-xs text-muted-foreground">{label.description}</p>
              </div>
            );
          })}
        </div>

        {mayBenefitCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            {formatCount(mayBenefitCount, "transaction")} could use stronger
            records — linking a receipt or adding a short note often helps.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your business transactions are generally well supported for this tax year.
          </p>
        )}

        <Link
          href={buildTransactionsLink({
            taxYearId,
            scope: "business",
          })}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View business transactions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
