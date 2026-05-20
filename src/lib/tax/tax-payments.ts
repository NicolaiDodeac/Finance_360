import { getFlowType } from "@/lib/transactions/classification";
import { buildTransactionsLink } from "@/lib/tax/links";
import type { TaxYearRow } from "@/lib/tax-years/queries";

export interface TaxPaymentTransaction {
  id: string;
  amount: number;
  direction: string;
  is_business: boolean;
  transaction_date: string;
  description: string | null;
  merchant_name: string | null;
  raw_import_data: Record<string, unknown> | null;
  category: { id: string; slug: string; name: string } | null;
}

export interface TaxPaymentsSummary {
  totalAmount: number;
  transactionCount: number;
  transactionsHref: string;
}

export function isTaxPaymentTransaction(tx: {
  direction: string;
  is_business?: boolean;
  raw_import_data?: Record<string, unknown> | null;
  category?: { slug: string } | null;
}): boolean {
  if (tx.direction !== "expense") return false;
  if (
    getFlowType({
      direction: tx.direction,
      is_business: tx.is_business ?? false,
      raw_import_data: tx.raw_import_data,
    }) === "tax_payment"
  ) {
    return true;
  }
  return tx.category?.slug === "tax-payment";
}

export function computeTaxPaymentsSummary(
  transactions: TaxPaymentTransaction[],
  taxYearId: string
): TaxPaymentsSummary {
  const totalAmount = transactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );
  const categoryId =
    transactions.find((tx) => tx.category?.slug === "tax-payment")?.category
      ?.id ?? transactions[0]?.category?.id ?? null;

  return {
    totalAmount,
    transactionCount: transactions.length,
    transactionsHref: buildTaxPaymentsTransactionsLink(taxYearId, categoryId),
  };
}

export function buildTaxPaymentsTransactionsLink(
  taxYearId: string,
  categoryId: string | null
): string {
  return buildTransactionsLink({
    taxYearId,
    direction: "expense",
    scope: "personal",
    categoryId: categoryId ?? undefined,
  });
}

export function isTransactionInTaxYear(
  transactionDate: string,
  taxYear: Pick<TaxYearRow, "start_date" | "end_date">
): boolean {
  return (
    transactionDate >= taxYear.start_date &&
    transactionDate <= taxYear.end_date
  );
}
