import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/tax/format";
import type { TaxOverviewMetrics } from "@/lib/tax/types";

interface TaxOverviewCardsProps {
  metrics: TaxOverviewMetrics;
}

interface MetricCard {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

export function TaxOverviewCards({ metrics }: TaxOverviewCardsProps) {
  const cards: MetricCard[] = [
    {
      label: "Gross self-employed income",
      value: formatMoney(metrics.grossSelfEmployedIncome),
      hint: "Business income in this tax year",
    },
    {
      label: "Allowable business expenses",
      value: formatMoney(metrics.allowableBusinessExpenses),
      hint: "HMRC categories marked as allowable",
    },
    {
      label: "Estimated profit",
      value: formatMoney(metrics.estimatedProfit),
      hint: "Income minus allowable expenses",
      emphasis: true,
    },
    {
      label: "Review recommended",
      value: String(metrics.evidenceConfidence.reviewRecommended),
      hint: "Business transactions where additional proof may help",
    },
    {
      label: "Uncategorized business expenses",
      value: String(metrics.uncategorizedBusinessExpensesCount),
      hint: "No HMRC category assigned yet",
    },
    {
      label: "Suggested tax pot",
      value: formatMoney(metrics.suggestedTaxPot),
      hint: "Rough planning estimate, not final tax advice.",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p
              className={`text-2xl font-semibold tabular-nums ${
                card.emphasis ? "text-foreground" : ""
              }`}
            >
              {card.value}
            </p>
            {card.hint ? (
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
