import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardMoneyFlow } from "@/lib/dashboard/types";
import { formatMoney } from "@/lib/transactions/format";

interface DashboardMoneyFlowCardProps {
  moneyFlow: DashboardMoneyFlow;
  monthLabel: string;
  currency: string;
}

function MoneyFlowRow({
  label,
  amount,
  currency,
  positive,
  muted,
}: {
  label: string;
  amount: number;
  currency: string;
  positive?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`shrink-0 font-semibold tabular-nums ${
          muted
            ? "text-muted-foreground"
            : positive && amount > 0
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-foreground"
        }`}
      >
        {formatMoney(amount, currency)}
      </span>
    </div>
  );
}

export function DashboardMoneyFlowCard({
  moneyFlow,
  monthLabel,
  currency,
}: DashboardMoneyFlowCardProps) {
  const {
    income,
    personalSpending,
    businessIncome,
    businessExpenses,
    savedOrInvested,
    debtRepaid,
    taxPaid,
    transfersExcluded,
    showBusinessBreakdown,
  } = moneyFlow;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Money flow for {monthLabel}</CardTitle>
        <CardDescription>
          Not all money out is spending. Finance 360 separates spending, saving,
          debt and transfers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="divide-y divide-border/60">
          {showBusinessBreakdown ? (
            <>
              <MoneyFlowRow label="Personal income" amount={income} currency={currency} />
              <MoneyFlowRow
                label="Business income"
                amount={businessIncome}
                currency={currency}
              />
            </>
          ) : (
            <MoneyFlowRow label="Income" amount={income} currency={currency} />
          )}
          <MoneyFlowRow
            label="Personal spending"
            amount={personalSpending}
            currency={currency}
          />
          {showBusinessBreakdown ? (
            <MoneyFlowRow
              label="Business costs"
              amount={businessExpenses}
              currency={currency}
            />
          ) : null}
          <MoneyFlowRow
            label="Saved / invested"
            amount={savedOrInvested}
            currency={currency}
            positive
          />
          <MoneyFlowRow
            label="Debt reduced"
            amount={debtRepaid}
            currency={currency}
            positive
          />
          {(taxPaid > 0 || showBusinessBreakdown) && (
            <MoneyFlowRow label="Tax paid" amount={taxPaid} currency={currency} />
          )}
          <MoneyFlowRow
            label="Transfers"
            amount={transfersExcluded}
            currency={currency}
            muted
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Transfers between your own accounts are excluded from the income and
          spending lines above.
        </p>
      </CardContent>
    </Card>
  );
}
