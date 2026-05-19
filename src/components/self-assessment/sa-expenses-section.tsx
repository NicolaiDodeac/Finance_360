import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEvidenceCount } from "@/lib/evidence/labels";
import type { EvidenceConfidenceLevel } from "@/lib/evidence/types";
import { formatCount, formatMoney } from "@/lib/tax/format";
import type { SaExpenseGroupRow } from "@/lib/self-assessment/types";

interface SaExpensesSectionProps {
  groups: SaExpenseGroupRow[];
}

function evidenceSummary(group: SaExpenseGroupRow): string {
  const { evidenceCounts: c } = group;
  if (c.total === 0) {
    return "No transactions in this category";
  }

  const parts: string[] = [];
  const levels: EvidenceConfidenceLevel[] = [
    "high",
    "medium",
    "low",
    "review_recommended",
  ];

  for (const level of levels) {
    const key =
      level === "review_recommended" ? "reviewRecommended" : level;
    const count = c[key as keyof typeof c] as number;
    if (count > 0) {
      parts.push(formatEvidenceCount(count, level));
    }
  }

  return parts.join(" · ");
}

function statusLabel(group: SaExpenseGroupRow): string {
  if (group.transactionCount === 0) return "No activity";
  return group.status === "ready" ? "Ready" : "Review recommended";
}

export function SaExpensesSection({ groups }: SaExpensesSectionProps) {
  return (
    <Card id="step-expenses">
      <CardHeader>
        <CardTitle className="text-base">Step 2 — Allowable expenses by category</CardTitle>
        <CardDescription>
          Business expenses grouped into HMRC Self Employment (SA103) style lines.
          Assign HMRC categories on transactions to populate each line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {groups.map((group) => (
            <li
              key={group.groupId}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{group.label}</p>
                  <Badge
                    variant={
                      group.status === "ready"
                        ? "business"
                        : group.status === "review_recommended"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {statusLabel(group)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCount(group.transactionCount, "transaction")}
                  {group.transactionCount > 0 ? (
                    <>
                      {" "}
                      · {evidenceSummary(group)}
                    </>
                  ) : null}
                </p>
                {group.reviewRecommendedCount > 0 ? (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {formatCount(
                      group.reviewRecommendedCount,
                      "transaction"
                    )}{" "}
                    with review recommended
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-4 sm:shrink-0">
                <p className="text-lg font-semibold tabular-nums">
                  {formatMoney(group.totalAmount)}
                </p>
                {group.transactionCount > 0 ? (
                  <Link
                    href={group.transactionsLink}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
