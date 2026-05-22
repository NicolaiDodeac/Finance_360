"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptDetailDrawer } from "@/components/receipts/receipt-detail-drawer";
import { ReceiptListItem } from "@/components/receipts/receipt-list-item";
import { ReceiptUnmatchedSection } from "@/components/receipts/receipt-unmatched-section";
import { ReceiptCaptureHub } from "@/components/receipts/receipt-capture-hub";
import { ReceiptUploadForm } from "@/components/receipts/receipt-upload-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReceiptWithRelations } from "@/lib/receipts/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptsVaultViewProps {
  receipts: ReceiptWithRelations[];
  taxYears: TaxYearRow[];
  defaultTaxYearId?: string | null;
  loadError?: string | null;
}

export function ReceiptsVaultView({
  receipts,
  taxYears,
  defaultTaxYearId = null,
  loadError,
}: ReceiptsVaultViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReceiptWithRelations | null>(null);

  function handleReceiptSelect(receipt: ReceiptWithRelations) {
    if (!receipt.attached_transaction) {
      router.push(`/receipts/review/${receipt.id}`);
      return;
    }
    setSelected(receipt);
  }

  const unmatched = useMemo(
    () => receipts.filter((r) => !r.attached_transaction),
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
        onClose={() => setSelected(null)}
      />
    </>
  );
}
