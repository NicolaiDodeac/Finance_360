import { PageHeader } from "@/components/shared/page-header";
import { ImportWizard } from "@/components/import/import-wizard";
import { requireAuth } from "@/lib/auth/helpers";
import { getAccounts } from "@/lib/accounts/queries";

export const runtime = "nodejs";
export const maxDuration = 60;

export default async function ImportTransactionsPage() {
  const user = await requireAuth();
  const accounts = await getAccounts(user.id);
  const defaultAccountId = accounts[0]?.id ?? "";

  return (
    <>
      <PageHeader
        backHref="/transactions"
        backLabel="Back to transactions"
        title="Import statement"
        description="Upload a PDF bank statement or CSV file. Review transactions before importing."
      />
      {accounts.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          No accounts found. Visit Transactions first so a default account can be
          created, then return here to import.
        </p>
      ) : (
        <ImportWizard accounts={accounts} defaultAccountId={defaultAccountId} />
      )}
    </>
  );
}
