import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getAccounts } from "@/lib/accounts/queries";
import { getCategories } from "@/lib/categories/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import { getUnmatchedReceipts } from "@/lib/receipts/queries";
import { getTaxYears } from "@/lib/tax-years/queries";
import {
  parseTransactionSearchParams,
  type TransactionSearchParams,
} from "@/lib/transactions/filters";
import { getTransactions } from "@/lib/transactions/queries";

interface TransactionsPageProps {
  searchParams: Promise<TransactionSearchParams>;
}

async function TransactionsContent({
  searchParams,
}: {
  searchParams: Awaited<TransactionsPageProps["searchParams"]>;
}) {
  const user = await requireAuth();
  const filters = parseTransactionSearchParams(searchParams);

  let loadError: string | null = null;
  let transactions: Awaited<ReturnType<typeof getTransactions>> = [];
  let accounts: Awaited<ReturnType<typeof getAccounts>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let hmrcCategories: Awaited<ReturnType<typeof getHmrcCategories>> = [];
  let taxYears: Awaited<ReturnType<typeof getTaxYears>> = [];
  let unmatchedReceipts: Awaited<ReturnType<typeof getUnmatchedReceipts>> = [];

  try {
    [accounts, categories, hmrcCategories, taxYears, transactions, unmatchedReceipts] =
      await Promise.all([
        getAccounts(user.id),
        getCategories(user.id),
        getHmrcCategories(),
        getTaxYears(user.id),
        getTransactions(user.id, filters),
        getUnmatchedReceipts(user.id),
      ]);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load transactions.";
  }

  return (
    <TransactionsView
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      hmrcCategories={hmrcCategories}
      taxYears={taxYears}
      unmatchedReceipts={unmatchedReceipts}
      loadError={loadError}
    />
  );
}

function TransactionsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-xl bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <>
      <PageHeader
        title="Transactions"
        description="View and manage all your income and spending."
      />
      <Suspense fallback={<TransactionsLoading />}>
        <TransactionsContent searchParams={resolvedSearchParams} />
      </Suspense>
    </>
  );
}
