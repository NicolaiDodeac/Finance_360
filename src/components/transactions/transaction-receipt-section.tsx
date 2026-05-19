"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  attachReceiptToTransaction,
  detachReceiptFromTransaction,
  uploadAndAttachReceipt,
} from "@/lib/receipts/actions";
import type { ReceiptWithRelations } from "@/lib/receipts/types";
import { EvidenceBadge } from "@/components/evidence/evidence-badge";
import {
  evaluateTransactionEvidence,
  toEvidenceInput,
} from "@/lib/evidence";
import type { TransactionWithRelations } from "@/lib/transactions/types";

interface TransactionReceiptSectionProps {
  transaction: TransactionWithRelations;
  unmatchedReceipts: ReceiptWithRelations[];
  disabled?: boolean;
}

export function TransactionReceiptSection({
  transaction,
  unmatchedReceipts,
  disabled,
}: TransactionReceiptSectionProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState("");

  const attached = transaction.receipt;
  const isBusinessExpense =
    transaction.is_business && transaction.direction === "expense";

  const evidence = useMemo(() => {
    const input = toEvidenceInput(transaction);
    return evaluateTransactionEvidence(input, { peerTransactions: [input] });
  }, [transaction]);

  if (!isBusinessExpense) {
    return (
      <p className="text-sm text-muted-foreground">
        Mark as a business expense to attach proof.
      </p>
    );
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Please choose a file.");
      return;
    }

    if (transaction.tax_year_id) {
      formData.set("tax_year_id", transaction.tax_year_id);
    }
    if (transaction.merchant_name && !formData.get("merchant_name")) {
      formData.set("merchant_name", transaction.merchant_name);
    }
    if (transaction.amount && !formData.get("total_amount")) {
      formData.set("total_amount", String(transaction.amount));
    }
    if (transaction.transaction_date && !formData.get("receipt_date")) {
      formData.set("receipt_date", transaction.transaction_date);
    }

    startTransition(async () => {
      const result = await uploadAndAttachReceipt(transaction.id, formData);
      if (!result.success) {
        setError(result.error ?? "Could not store proof.");
        return;
      }
      fileRef.current?.form?.reset();
      router.refresh();
    });
  }

  function handleAttachExisting() {
    if (!selectedReceiptId) return;
    setError(null);

    startTransition(async () => {
      const result = await attachReceiptToTransaction(
        selectedReceiptId,
        transaction.id
      );
      if (!result.success) {
        setError(result.error ?? "Could not link proof.");
        return;
      }
      setSelectedReceiptId("");
      router.refresh();
    });
  }

  function handleDetach() {
    setError(null);
    startTransition(async () => {
      const result = await detachReceiptFromTransaction(transaction.id);
      if (!result.success) {
        setError(result.error ?? "Could not unlink proof.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-medium text-foreground">Proof stored</h4>
          <p className="text-xs text-muted-foreground">
            Link a receipt or bill to strengthen this record — evidence confidence
            updates when you attach proof.
          </p>
        </div>
        {evidence ? <EvidenceBadge evaluation={evidence} /> : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {attached ? (
        <div className="flex flex-col gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-900 dark:text-emerald-200">
            <FileCheck className="h-4 w-4 shrink-0" />
            <span>
              {attached.merchant_name ??
                attached.original_filename ??
                "Receipt linked"}
              {evidence?.level === "high" || evidence?.level === "medium"
                ? " — stronger evidence available"
                : null}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/receipts">Open vault</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isPending}
              onClick={handleDetach}
            >
              Unlink
            </Button>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="tx-receipt-file" className="text-sm font-medium">
                Upload proof
              </Label>
              <input
                ref={fileRef}
                id="tx-receipt-file"
                name="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
                disabled={disabled || isPending}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" disabled={disabled || isPending}>
              <Upload className="h-4 w-4" />
              {isPending ? "Storing…" : "Store & link"}
            </Button>
          </form>

          {unmatchedReceipts.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="existing-receipt" className="text-sm font-medium">
                Or link existing proof
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  id="existing-receipt"
                  value={selectedReceiptId}
                  onChange={(e) => setSelectedReceiptId(e.target.value)}
                  disabled={disabled || isPending}
                  className="min-w-0 flex-1"
                >
                  <option value="">Choose stored receipt…</option>
                  {unmatchedReceipts.map((receipt) => (
                    <option key={receipt.id} value={receipt.id}>
                      {receipt.merchant_name ??
                        receipt.original_filename ??
                        "Receipt"}
                      {receipt.total_amount !== null
                        ? ` · £${Number(receipt.total_amount).toFixed(2)}`
                        : ""}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || isPending || !selectedReceiptId}
                  onClick={handleAttachExisting}
                >
                  Link
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
