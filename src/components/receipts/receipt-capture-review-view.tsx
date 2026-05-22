"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Search,
} from "lucide-react";
import { ReceiptAttachPanel } from "@/components/receipts/receipt-attach-panel";
import { ReceiptCreateFromReceipt } from "@/components/receipts/receipt-create-from-receipt";
import { ReceiptFileIcon } from "@/components/receipts/receipt-file-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  attachReceiptToTransaction,
  getReceiptPreviewUrl,
  updateReceiptMetadata,
} from "@/lib/receipts/actions";
import {
  formatMoney,
  formatTransactionDate,
} from "@/lib/receipts/format";
import type { ReceiptCaptureReviewData } from "@/lib/receipts/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptCaptureReviewViewProps {
  review: ReceiptCaptureReviewData;
  taxYears?: TaxYearRow[];
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return "Not detected";
  const labels: Record<string, string> = {
    cash: "Cash",
    card: "Card",
    contactless: "Contactless",
    unknown: "Unknown",
  };
  return labels[method] ?? method;
}

export function ReceiptCaptureReviewView({
  review,
}: ReceiptCaptureReviewViewProps) {
  const router = useRouter();
  const { receipt, extraction, suggestedMatch, candidates } = review;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const attached = receipt.attached_transaction;
  const hasMatch = !attached && (suggestedMatch !== null || candidates.length > 0);

  useEffect(() => {
    let cancelled = false;
    getReceiptPreviewUrl(receipt.id).then((result) => {
      if (!cancelled && result.success && result.data) {
        setPreviewUrl(result.data.url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [receipt.id]);

  function handleLinkSuggested() {
    if (!suggestedMatch) return;
    setError(null);
    startTransition(async () => {
      const result = await attachReceiptToTransaction(
        receipt.id,
        suggestedMatch.transaction.id
      );
      if (!result.success) {
        setError(result.error ?? "Could not link receipt.");
        return;
      }
      router.push("/receipts");
      router.refresh();
    });
  }

  function handleMetadataSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateReceiptMetadata(receipt.id, formData);
      if (!result.success) {
        setError(result.error ?? "Could not save details.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (attached) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="font-medium text-emerald-900 dark:text-emerald-200">
            Receipt linked
          </p>
          <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-300/90">
            {attached.merchant_name ?? attached.description ?? "Transaction"} ·{" "}
            {formatMoney(Number(attached.amount))} ·{" "}
            {formatTransactionDate(attached.transaction_date)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/receipts">Back to receipts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <ReceiptFileIcon mimeType={receipt.mime_type} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {receipt.original_filename ?? "Receipt"}
          </p>
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View original
            </a>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Extracted details</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Cancel" : "Edit details"}
          </Button>
        </div>

        {editing ? (
          <form onSubmit={handleMetadataSubmit} className="mt-4 space-y-3">
            <ReviewField label="Merchant" id="merchant_name">
              <Input
                id="merchant_name"
                name="merchant_name"
                defaultValue={receipt.merchant_name ?? ""}
                disabled={isPending}
              />
            </ReviewField>
            <ReviewField label="Date" id="receipt_date">
              <Input
                id="receipt_date"
                name="receipt_date"
                type="date"
                defaultValue={receipt.receipt_date ?? ""}
                disabled={isPending}
              />
            </ReviewField>
            <div className="grid gap-3 sm:grid-cols-2">
              <ReviewField label="Total" id="total_amount">
                <Input
                  id="total_amount"
                  name="total_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={receipt.total_amount ?? ""}
                  disabled={isPending}
                />
              </ReviewField>
              <ReviewField label="VAT" id="vat_amount">
                <Input
                  id="vat_amount"
                  name="vat_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={receipt.vat_amount ?? ""}
                  disabled={isPending}
                />
              </ReviewField>
            </div>
            <ReviewField label="Payment method" id="payment_method">
              <Select
                id="payment_method"
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
            </ReviewField>
            <input
              type="hidden"
              name="tax_year_id"
              value={receipt.tax_year_id ?? ""}
            />
            <input type="hidden" name="notes" value={receipt.notes ?? ""} />
            <Button type="submit" size="sm" disabled={isPending}>
              Save changes
            </Button>
          </form>
        ) : (
          <dl className="mt-3 grid gap-2 text-sm">
            <DetailRow
              label="Merchant"
              value={receipt.merchant_name ?? extraction.merchant ?? "—"}
            />
            <DetailRow
              label="Date"
              value={
                receipt.receipt_date
                  ? formatTransactionDate(receipt.receipt_date)
                  : "—"
              }
            />
            <DetailRow
              label="Total"
              value={
                receipt.total_amount !== null
                  ? formatMoney(Number(receipt.total_amount))
                  : "—"
              }
            />
            <DetailRow
              label="VAT"
              value={
                receipt.vat_amount !== null
                  ? formatMoney(Number(receipt.vat_amount))
                  : "—"
              }
            />
            <DetailRow
              label="Payment"
              value={formatPaymentMethod(receipt.payment_method)}
            />
          </dl>
        )}

        {extraction.fieldsFound.length > 0 && !editing ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Read from receipt: {extraction.fieldsFound.join(", ")}
          </p>
        ) : null}
      </section>

      {suggestedMatch ? (
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">
            Possible match found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Check this looks right before linking — nothing is linked until you
            confirm.
          </p>
          <div className="mt-3 rounded-lg border border-border bg-card px-3 py-3">
            <p className="text-sm font-medium">
              {suggestedMatch.transaction.merchant_name ??
                suggestedMatch.transaction.description ??
                "Transaction"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(Number(suggestedMatch.transaction.amount))} ·{" "}
              {formatTransactionDate(
                suggestedMatch.transaction.transaction_date
              )}
              {suggestedMatch.reasons.length > 0
                ? ` · ${suggestedMatch.reasons.join(", ")}`
                : ""}
            </p>
          </div>
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={isPending}
            onClick={handleLinkSuggested}
          >
            <Check className="h-4 w-4" />
            Link to suggested transaction
          </Button>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            No matching transaction yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Search your transactions, or create a new one from this receipt.
          </p>
        </section>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowSearch((v) => !v)}
        >
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search transaction manually
          </span>
          {showSearch ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {showSearch ? (
          <ReceiptAttachPanel
            receipt={receipt}
            onAttached={() => {
              router.push("/receipts");
              router.refresh();
            }}
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowCreate((v) => !v)}
        >
          <span>Create from receipt</span>
          {showCreate ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {showCreate ? (
          <ReceiptCreateFromReceipt receiptId={receipt.id} />
        ) : null}
      </div>

      {!hasMatch && candidates.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Other possible matches
          </p>
          <ul className="space-y-2">
            {candidates.slice(suggestedMatch ? 1 : 0, 4).map((item) => (
              <li
                key={item.transaction.id}
                className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium truncate">
                    {item.transaction.merchant_name ??
                      item.transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(Number(item.transaction.amount))} ·{" "}
                    {formatTransactionDate(item.transaction.transaction_date)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await attachReceiptToTransaction(
                        receipt.id,
                        item.transaction.id
                      );
                      if (result.success) {
                        router.push("/receipts");
                        router.refresh();
                      } else {
                        setError(result.error ?? "Could not link.");
                      }
                    });
                  }}
                >
                  Link
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Button asChild variant="ghost" className="w-full">
        <Link href="/receipts">Back to receipts</Link>
      </Button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
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
