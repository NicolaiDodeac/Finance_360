import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount, formatMoney } from "@/lib/tax/format";
import type { SaIncomeSection } from "@/lib/self-assessment/types";

interface SaIncomeSectionProps {
  income: SaIncomeSection;
}

export function SaIncomeSectionCard({ income }: SaIncomeSectionProps) {
  return (
    <Card id="step-income">
      <CardHeader>
        <CardTitle className="text-base">Step 1 — Business income</CardTitle>
        <CardDescription>
          Gross turnover from transactions marked as business income for this tax
          year.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Gross business income" value={formatMoney(income.grossIncome)} />
          <Metric
            label="Income transactions"
            value={formatCount(income.transactionCount, "transaction")}
          />
        </div>
        <Link
          href={income.transactionsLink}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View income transactions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
