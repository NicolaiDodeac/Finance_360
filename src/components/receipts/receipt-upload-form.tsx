"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadReceipt } from "@/lib/receipts/actions";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptUploadFormProps {
  taxYears: TaxYearRow[];
  defaultTaxYearId?: string | null;
  onSuccess?: (receiptId: string) => void;
  compact?: boolean;
}

export function ReceiptUploadForm({
  taxYears,
  defaultTaxYearId,
  onSuccess,
  compact,
}: ReceiptUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await uploadReceipt(formData);
      if (!result.success) {
        setError(result.error ?? "Upload failed.");
        return;
      }
      formRef.current?.reset();
      if (result.data?.id) {
        onSuccess?.(result.data.id);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={compact ? "space-y-4" : "space-y-4 rounded-xl border border-border bg-card p-4"}
    >
      {!compact ? (
        <div>
          <h3 className="text-sm font-medium text-foreground">Add proof</h3>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG, or HEIC — up to 10 MB. Details are optional.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <FormField label="File" id="receipt-file">
        <Input
          id="receipt-file"
          name="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
          required
          disabled={isPending}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Merchant" id="merchant_name">
          <Input
            id="merchant_name"
            name="merchant_name"
            placeholder="Optional"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Receipt date" id="receipt_date">
          <Input
            id="receipt_date"
            name="receipt_date"
            type="date"
            disabled={isPending}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Total amount" id="total_amount">
          <Input
            id="total_amount"
            name="total_amount"
            type="number"
            min={0}
            step="0.01"
            placeholder="Optional"
            disabled={isPending}
          />
        </FormField>

        <FormField label="VAT amount" id="vat_amount">
          <Input
            id="vat_amount"
            name="vat_amount"
            type="number"
            min={0}
            step="0.01"
            placeholder="Optional"
            disabled={isPending}
          />
        </FormField>
      </div>

      <FormField label="Tax year" id="tax_year_id">
        <Select
          id="tax_year_id"
          name="tax_year_id"
          defaultValue={defaultTaxYearId ?? ""}
          disabled={isPending}
        >
          <option value="">Not sure yet</option>
          {taxYears.map((taxYear) => (
            <option key={taxYear.id} value={taxYear.id}>
              {taxYear.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Notes" id="notes">
        <Textarea
          id="notes"
          name="notes"
          placeholder="Optional"
          rows={2}
          disabled={isPending}
        />
      </FormField>

      <Button type="submit" disabled={isPending}>
        <Upload className="h-4 w-4" />
        {isPending ? "Storing…" : "Store receipt"}
      </Button>
    </form>
  );
}

function FormField({
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
