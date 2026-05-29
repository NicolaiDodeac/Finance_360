"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Sparkles, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TransactionCreateDrawer } from "@/components/transactions/transaction-create-drawer";
import { TransactionEditDrawer } from "@/components/transactions/transaction-edit-drawer";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { EvidenceExplainerPanel } from "@/components/evidence/evidence-explainer-panel";
import { TransactionsEmptyState } from "@/components/transactions/transactions-empty-state";
import type { AccountRow } from "@/lib/accounts/queries";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { ReceiptWithRelations } from "@/lib/receipts/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import {
  evaluateManyTransactions,
  toEvidenceInput,
} from "@/lib/evidence";
import { CATEGORISE_ASSISTANT_PATH } from "@/lib/transactions/links";
import type { TransactionWithRelations } from "@/lib/transactions/types";

interface TransactionsViewProps {
  transactions: TransactionWithRelations[];
  accounts: AccountRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  taxYears: TaxYearRow[];
  unmatchedReceipts: ReceiptWithRelations[];
  uncategorisedCount: number;
  loadError?: string | null;
}

export function TransactionsView({
  transactions,
  accounts,
  categories,
  hmrcCategories,
  taxYears,
  unmatchedReceipts,
  uncategorisedCount,
  loadError,
}: TransactionsViewProps) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const defaultAccountId = accounts[0]?.id ?? "";

  const hasFilters = useMemo(() => {
    return Boolean(
      searchParams.get("q") ||
        searchParams.get("direction") ||
        searchParams.get("scope") ||
        searchParams.get("category") ||
        searchParams.get("taxYear")
    );
  }, [searchParams]);

  const evidenceByTransactionId = useMemo(() => {
    const inputs = transactions.map(toEvidenceInput);
    return evaluateManyTransactions(inputs, { peerTransactions: inputs });
  }, [transactions]);

  return (
  <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {transactions.length}{" "}
          {transactions.length === 1 ? "transaction" : "transactions"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/transactions/import">
              <Upload className="h-4 w-4" />
              Import statement
            </Link>
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add transaction
          </Button>
        </div>
      </div>

      {loadError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      )}

      {saveNotice ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          {saveNotice}
        </p>
      ) : null}

      {uncategorisedCount > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {uncategorisedCount} transaction
              {uncategorisedCount === 1 ? "" : "s"} need
              {uncategorisedCount === 1 ? "s" : ""} a category
            </p>
            <p className="text-sm text-muted-foreground">
              Answer a few quick questions — we sort out the categories and tax
              behind the scenes.
            </p>
          </div>
          <Button type="button" variant="secondary" asChild className="shrink-0">
            <Link href={CATEGORISE_ASSISTANT_PATH}>
              <Sparkles className="h-4 w-4" />
              Sort these out
            </Link>
          </Button>
        </div>
      )}

      <div className="mb-6">
        <TransactionFilters categories={categories} taxYears={taxYears} />
      </div>

      {transactions.length === 0 ? (
        <TransactionsEmptyState
          hasFilters={hasFilters}
          onAddClick={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <TransactionList
            transactions={transactions}
            evidenceByTransactionId={evidenceByTransactionId}
            onSelect={setEditing}
          />
          <div className="mt-8">
            <EvidenceExplainerPanel />
          </div>
        </>
      )}

      <TransactionCreateDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        accounts={accounts}
        categories={categories}
        hmrcCategories={hmrcCategories}
        defaultAccountId={defaultAccountId}
      />

      <TransactionEditDrawer
        transaction={editing}
        onClose={() => setEditing(null)}
        onSaved={({ similarUpdatedCount }) => {
          if (similarUpdatedCount > 0) {
            setSaveNotice(
              `Saved. Also updated ${similarUpdatedCount} similar transaction${similarUpdatedCount === 1 ? "" : "s"} with the same category.`
            );
          } else {
            setSaveNotice(null);
          }
        }}
        accounts={accounts}
        categories={categories}
        hmrcCategories={hmrcCategories}
        unmatchedReceipts={unmatchedReceipts}
      />
    </>
  );
}
