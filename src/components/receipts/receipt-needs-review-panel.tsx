"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ReceiptDeleteButton,
  confirmDeleteReceipt,
} from "@/components/receipts/receipt-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReceiptFileIcon } from "@/components/receipts/receipt-file-icon";
import {
  deleteReceipt,
  updateReceiptMetadata,
} from "@/lib/receipts/actions";
import { retryReceiptOcr } from "@/lib/receipts/capture-actions";
import type { ReceiptWithRelations } from "@/lib/receipts/types";

interface ReceiptNeedsReviewPanelProps {
  receipt: ReceiptWithRelations;
}

export function ReceiptNeedsReviewPanel({ receipt }: ReceiptNeedsReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [formMerchant, setFormMerchant] = useState(receipt.merchant_name ?? "");
  const [formDate, setFormDate] = useState(receipt.receipt_date ?? "");
  const [formTotal, setFormTotal] = useState(
    receipt.total_amount !== null ? String(receipt.total_amount) : ""
  );

  function handleRetryOcr() {
    setError(null);
    setNotice(null);
    setIsRetrying(true);
    startTransition(async () => {
      try {
        const result = await retryReceiptOcr(receipt.id);
        if (!result.success) {
          setError(result.error ?? "Could not read receipt.");
          return;
        }

        const data = result.data;
        if (!data) {
          setError("Scan finished but no data returned.");
          return;
        }

        if (data.merchant) setFormMerchant(data.merchant);
        if (data.receiptDate) setFormDate(data.receiptDate);
        if (data.totalAmount !== null) setFormTotal(String(data.totalAmount));

        if (data.status === "ready") {
          setNotice("Scan complete — loading review…");
          router.refresh();
          return;
        }

        const missing: string[] = [];
        if (!data.merchant) missing.push("merchant");
        if (!data.receiptDate) missing.push("date");
        if (data.totalAmount === null) missing.push("total");
        setNotice(
          missing.length > 0
            ? `Scan ran but still missing: ${missing.join(", ")}. Fill them below or try a clearer photo.`
            : "Scan ran — please check the fields below."
        );
        router.refresh();
      } finally {
        setIsRetrying(false);
      }
    });
  }

  function handleDelete() {
    if (!confirmDeleteReceipt()) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteReceipt(receipt.id);
      if (!result.success) {
        setError(result.error ?? "Could not delete.");
        return;
      }
      router.push("/receipts");
      router.refresh();
    });
  }

  function handleMetadataSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateReceiptMetadata(receipt.id, formData);
      if (!result.success) {
        setError(result.error ?? "Could not save.");
        return;
      }
      router.refresh();
    });
  }

  const busy = isPending || isRetrying;

  const missingFields = [
    !formMerchant.trim() ? "merchant" : null,
    !formDate.trim() ? "date" : null,
    !formTotal.trim() ? "amount" : null,
  ].filter(Boolean) as string[];

  const checkMessage =
    missingFields.length > 0
      ? `Just add the ${missingFields.join(" and ")} below, then continue.`
      : "Check the details below look right, then continue.";

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-center dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="font-medium text-amber-950 dark:text-amber-100">
          We need one quick check
        </p>
        <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
          Receipt saved as proof. {checkMessage} You can also retry the scan
          (works best on a flat, well-lit photo).
        </p>
      </div>

      {notice ? (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <ReceiptFileIcon mimeType={receipt.mime_type} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {formMerchant || receipt.original_filename || "Receipt"}
          </p>
          <p className="text-xs text-muted-foreground">Incomplete scan</p>
        </div>
      </div>

      {editing ? (
        <form
          key={`${formMerchant}-${formDate}-${formTotal}`}
          onSubmit={handleMetadataSubmit}
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <ReviewField label="Merchant" id="merchant_name">
            <Input
              id="merchant_name"
              name="merchant_name"
              value={formMerchant}
              onChange={(e) => setFormMerchant(e.target.value)}
              disabled={busy}
              required
            />
          </ReviewField>
          <ReviewField label="Date" id="receipt_date">
            <Input
              id="receipt_date"
              name="receipt_date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              disabled={busy}
              required
            />
          </ReviewField>
          <ReviewField label="Total" id="total_amount">
            <Input
              id="total_amount"
              name="total_amount"
              type="text"
              inputMode="decimal"
              placeholder="16.40"
              value={formTotal}
              onChange={(e) => setFormTotal(e.target.value)}
              disabled={busy}
              required
            />
          </ReviewField>
          <input
            type="hidden"
            name="tax_year_id"
            value={receipt.tax_year_id ?? ""}
          />
          <input type="hidden" name="notes" value={receipt.notes ?? ""} />
          <input
            type="hidden"
            name="payment_method"
            value={receipt.payment_method ?? ""}
          />
          <Button type="submit" className="h-12 w-full" disabled={busy}>
            {isPending ? "Saving…" : "Save and continue"}
          </Button>
        </form>
      ) : null}

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          disabled={busy}
          onClick={handleRetryOcr}
        >
          {isRetrying ? "Scanning receipt…" : "Retry scan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          disabled={busy}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Hide form" : "Edit manually"}
        </Button>
        <ReceiptDeleteButton onDelete={handleDelete} disabled={busy} />
        <Button asChild variant="ghost" className="h-11 w-full">
          <Link href="/receipts">Continue later</Link>
        </Button>
      </div>
    </div>
  );
}

function ReviewField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
