"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptDetailDrawer } from "@/components/receipts/receipt-detail-drawer";
import { ReceiptListItem } from "@/components/receipts/receipt-list-item";
import { ReceiptUnmatchedSection } from "@/components/receipts/receipt-unmatched-section";
import { ReceiptCaptureHub } from "@/components/receipts/receipt-capture-hub";
import { ReceiptUploadForm } from "@/components/receipts/receipt-upload-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { ReceiptWithRelations } from "@/lib/receipts/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptsVaultViewProps {
  receipts: ReceiptWithRelations[];
  taxYears: TaxYearRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  defaultTaxYearId?: string | null;
  loadError?: string | null;
}

export function ReceiptsVaultView({
  receipts,
  taxYears,
  categories,
  hmrcCategories,
  defaultTaxYearId = null,
  loadError,
}: ReceiptsVaultViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReceiptWithRelations | null>(null);

  useEffect(() => {
    if (!selected) return;
    const updated = receipts.find((r) => r.id === selected.id);
    if (!updated) return;
    if (updated.updated_at !== selected.updated_at) {
      setSelected(updated);
    }
  }, [receipts, selected]);

  function handleReceiptSelect(receipt: ReceiptWithRelations) {
    if (!receipt.attached_transaction) {
      router.push(`/receipts/review/${receipt.id}`);
      return;
    }
    setSelected(receipt);
  }

  const needsReview = useMemo(
    () =>
      receipts.filter(
        (r) =>
          !r.attached_transaction &&
          (r as { status?: string }).status === "needs_review"
      ),
    [receipts]
  );

  const unmatched = useMemo(
    () =>
      receipts.filter(
        (r) =>
          !r.attached_transaction &&
          (r as { status?: string }).status !== "needs_review"
      ),
    [receipts]
  );

  const matched = useMemo(
    () => receipts.filter((r) => r.attached_transaction),
    [receipts]
  );

  return (
    <>
      <ReceiptCaptureHub
        taxYears={taxYears}
        defaultTaxYearId={defaultTaxYearId}
      />

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Add details manually (optional)
          </summary>
          <div className="mt-4">
            <ReceiptUploadForm
              taxYears={taxYears}
              defaultTaxYearId={defaultTaxYearId}
              compact
              onSuccess={(receiptId) =>
                router.push(`/receipts/review/${receiptId}`)
              }
            />
          </div>
        </details>

        {needsReview.length > 0 ? (
          <section className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              Needs review ({needsReview.length})
            </h2>
            <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
              Incomplete scans — finish these before they mix with ready receipts.
            </p>
            <ul className="mt-3 space-y-2">
              {needsReview.map((r) => (
                <ReceiptListItem
                  key={r.id}
                  receipt={r}
                  onClick={() => handleReceiptSelect(r)}
                  badge="Needs review"
                />
              ))}
            </ul>
          </section>
        ) : null}

        <ReceiptUnmatchedSection
          receipts={unmatched}
          onSelect={handleReceiptSelect}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All stored proof</CardTitle>
          <CardDescription>
            {receipts.length}{" "}
            {receipts.length === 1 ? "receipt" : "receipts"} in your vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing stored yet. Upload your first receipt above.
            </p>
          ) : (
            receipts.map((receipt) => (
              <ReceiptListItem
                key={receipt.id}
                receipt={receipt}
                onSelect={handleReceiptSelect}
              />
            ))
          )}
        </CardContent>
      </Card>

      {matched.length > 0 && unmatched.length > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {matched.length} linked · {unmatched.length} waiting to match
        </p>
      ) : null}

      <ReceiptDetailDrawer
        receipt={selected}
        taxYears={taxYears}
        categories={categories}
        hmrcCategories={hmrcCategories}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
