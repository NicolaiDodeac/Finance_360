import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TaxPaymentsRecorded } from "@/lib/tax/types";
import { formatMoney } from "@/lib/transactions/format";

interface TaxPaymentsRecordedProps {
  taxPayments: TaxPaymentsRecorded;
  currency?: string;
}

export function TaxPaymentsRecordedSection({
  taxPayments,
  currency = "GBP",
}: TaxPaymentsRecordedProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tax payments recorded</CardTitle>
        <CardDescription>
          HMRC and other tax payments in this tax year — separate from business
          expenses and lifestyle spending.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Total paid</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {formatMoney(taxPayments.totalAmount, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Transactions</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {taxPayments.transactionCount}
            </dd>
          </div>
        </dl>
        {taxPayments.transactionCount > 0 ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={taxPayments.transactionsHref}>
              View in transactions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Categorise HMRC payments as &ldquo;Tax payment&rdquo; when you review
            transactions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
