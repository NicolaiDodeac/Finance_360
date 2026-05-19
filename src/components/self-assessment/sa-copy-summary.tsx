"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/tax/format";
import type { SaCopySummary } from "@/lib/self-assessment/types";

interface SaCopySummaryPanelProps {
  summary: SaCopySummary;
}

function buildCopyText(summary: SaCopySummary): string {
  const lines: string[] = [
    "Self Assessment prep figures (from Finance 360)",
    "",
    `Turnover / gross income: ${formatMoney(summary.turnover)}`,
    `Total allowable expenses: ${formatMoney(summary.totalAllowableExpenses)}`,
    `Profit before tax: ${formatMoney(summary.profitBeforeTax)}`,
    "",
    "Expense categories:",
  ];

  for (const line of summary.categoryLines) {
    lines.push(`  ${line.label}: ${formatMoney(line.amount)}`);
  }

  lines.push(
    "",
    `Suggested tax pot (25% of profit, planning only): ${formatMoney(summary.suggestedTaxPot)}`,
    "",
    "Review these figures before entering into HMRC Self Assessment."
  );

  return lines.join("\n");
}

export function SaCopySummaryPanel({ summary }: SaCopySummaryPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = buildCopyText(summary);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [summary]);

  return (
    <Card id="step-copy">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              Step 4 — Copy numbers for tax return
            </CardTitle>
            <CardDescription>
              These figures are prepared from your records. Review them before
              entering into HMRC.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy figures
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <SummaryRow label="Turnover / gross income" value={summary.turnover} />
          <SummaryRow
            label="Total allowable expenses"
            value={summary.totalAllowableExpenses}
          />
          <SummaryRow label="Profit before tax" value={summary.profitBeforeTax} />
          <SummaryRow
            label="Suggested tax pot (planning)"
            value={summary.suggestedTaxPot}
            hint="Rough 25% set-aside — not your final tax bill"
          />
        </dl>

        {summary.categoryLines.length > 0 ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">
              Category totals
            </p>
            <ul className="space-y-2">
              {summary.categoryLines.map((line) => (
                <li
                  key={line.label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(line.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground whitespace-pre-wrap">
          {buildCopyText(summary)}
        </pre>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
        {formatMoney(value)}
      </dd>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
