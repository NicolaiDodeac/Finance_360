"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { ReceiptAttachPanel } from "@/components/receipts/receipt-attach-panel";
import { ReceiptFileIcon } from "@/components/receipts/receipt-file-icon";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteReceipt,
  detachReceiptFromTransaction,
  getReceiptPreviewUrl,
  updateReceiptMetadata,
} from "@/lib/receipts/actions";
import {
  formatFileSize,
  formatMoney,
  formatTransactionDate,
} from "@/lib/receipts/format";
import type { ReceiptWithRelations } from "@/lib/receipts/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptDetailDrawerProps {
  receipt: ReceiptWithRelations | null;
  taxYears: TaxYearRow[];
  onClose: () => void;
}

export function ReceiptDetailDrawer({
  receipt,
  taxYears,
  onClose,
}: ReceiptDetailDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!receipt) {
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    getReceiptPreviewUrl(receipt.id).then((result) => {
      if (!cancelled && result.success && result.data) {
        setPreviewUrl(result.data.url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [receipt]);

  function handleMetadataSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!receipt) return;

    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateReceiptMetadata(receipt.id, formData);
      if (!result.success) {
        setError(result.error ?? "Could not save details.");
        return;
      }
      router.refresh();
    });
  }

  function handleDetach() {
    if (!receipt?.attached_transaction) return;

    setError(null);
    startTransition(async () => {
      const result = await detachReceiptFromTransaction(
        receipt.attached_transaction!.id
      );
      if (!result.success) {
        setError(result.error ?? "Could not unlink.");
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!receipt) return;
    if (!window.confirm("Delete this stored proof? This cannot be undone.")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteReceipt(receipt.id);
      if (!result.success) {
        setError(result.error ?? "Could not delete receipt.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const attached = receipt?.attached_transaction;

  return (
    <Drawer open={!!receipt} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {receipt && (
          <div className="flex h-full flex-col">
            <DrawerHeader>
              <DrawerTitle>
                {receipt.merchant_name ||
                  receipt.original_filename ||
                  "Stored proof"}
              </DrawerTitle>
              <DrawerDescription>
                Proof stored · {formatFileSize(receipt.file_size_bytes)}
              </DrawerDescription>
            </DrawerHeader>

            <DrawerBody className="space-y-6">
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center gap-3">
                <ReceiptFileIcon mimeType={receipt.mime_type} />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">
                    {receipt.original_filename ?? "File"}
                  </p>
                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open file
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Loading preview…</p>
                  )}
                </div>
              </div>

              {attached ? (
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Linked to transaction
                  </p>
                  <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-300/90">
                    {attached.merchant_name ?? attached.description ?? "Expense"}{" "}
                    · {formatMoney(Number(attached.amount))} ·{" "}
                    {formatTransactionDate(attached.transaction_date)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    size="sm"
                    disabled={isPending}
                    onClick={handleDetach}
                  >
                    Unlink from transaction
                  </Button>
                </div>
              ) : (
                <ReceiptAttachPanel
                  receipt={receipt}
                  onAttached={() => router.refresh()}
                />
              )}

              <form onSubmit={handleMetadataSubmit} className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-medium">Details</h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MetadataField label="Merchant" id="edit-merchant">
                    <Input
                      id="edit-merchant"
                      name="merchant_name"
                      defaultValue={receipt.merchant_name ?? ""}
                      disabled={isPending}
                    />
                  </MetadataField>
                  <MetadataField label="Receipt date" id="edit-date">
                    <Input
                      id="edit-date"
                      name="receipt_date"
                      type="date"
                      defaultValue={receipt.receipt_date ?? ""}
                      disabled={isPending}
                    />
                  </MetadataField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MetadataField label="Total amount" id="edit-total">
                    <Input
                      id="edit-total"
                      name="total_amount"
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={receipt.total_amount ?? ""}
                      disabled={isPending}
                    />
                  </MetadataField>
                  <MetadataField label="Payment method" id="edit-payment">
                    <Select
                      id="edit-payment"
                      name="payment_method"
                      defaultValue={receipt.payment_method ?? ""}
                      disabled={isPending}
                    >
                      <option value="">Not sure</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="contactless">Contactless</option>
                      <option value="unknown">Unknown</option>
                    </Select>
                  </MetadataField>
                  <MetadataField label="VAT amount" id="edit-vat">
                    <Input
                      id="edit-vat"
                      name="vat_amount"
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={receipt.vat_amount ?? ""}
                      disabled={isPending}
                    />
                  </MetadataField>
                </div>

                <MetadataField label="Tax year" id="edit-tax-year">
                  <Select
                    id="edit-tax-year"
                    name="tax_year_id"
                    defaultValue={receipt.tax_year_id ?? ""}
                    disabled={isPending}
                  >
                    <option value="">Not sure yet</option>
                    {taxYears.map((taxYear) => (
                      <option key={taxYear.id} value={taxYear.id}>
                        {taxYear.label}
                      </option>
                    ))}
                  </Select>
                </MetadataField>

                <MetadataField label="Notes" id="edit-notes">
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    rows={2}
                    defaultValue={receipt.notes ?? ""}
                    disabled={isPending}
                  />
                </MetadataField>

                <Button type="submit" variant="outline" disabled={isPending}>
                  {isPending ? "Saving…" : "Save details"}
                </Button>
              </form>
            </DrawerBody>

            <DrawerFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700 dark:text-red-400"
                disabled={isPending}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function MetadataField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
