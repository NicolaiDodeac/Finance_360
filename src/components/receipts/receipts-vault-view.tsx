"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptDetailDrawer } from "@/components/receipts/receipt-detail-drawer";
import { ReceiptListItem } from "@/components/receipts/receipt-list-item";
import { ReceiptUnmatchedSection } from "@/components/receipts/receipt-unmatched-section";
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
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Receipt Vault</p>
        <p className="mt-1">
          Store bills and receipts as proof for your business spending. Link each
          one to a transaction when you are ready — this keeps your records calm
          and complete.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ReceiptUploadForm
          taxYears={taxYears}
          defaultTaxYearId={defaultTaxYearId}
          onSuccess={() => router.refresh()}
        />

        <ReceiptUnmatchedSection
          receipts={unmatched}
          onSelect={setSelected}
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
                onSelect={setSelected}
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
