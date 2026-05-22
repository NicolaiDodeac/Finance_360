"use client";

import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useReceiptCapture } from "@/components/receipts/use-receipt-capture";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptCaptureHubProps {
  taxYears: TaxYearRow[];
  defaultTaxYearId?: string | null;
}

export function ReceiptCaptureHub({
  taxYears,
  defaultTaxYearId,
}: ReceiptCaptureHubProps) {
  const {
    isPending,
    error,
    taxYearId,
    setTaxYearId,
    fileInputs,
    openCamera,
    openFilePicker,
  } = useReceiptCapture({ defaultTaxYearId });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Smart Receipt Capture
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Photograph or upload a receipt. We read the details and suggest a
          matching transaction — you confirm before anything is linked.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {fileInputs}

      <Button
        type="button"
        size="lg"
        className="h-14 w-full text-base"
        disabled={isPending}
        onClick={openCamera}
      >
        <Camera className="h-5 w-5" />
        {isPending ? "Uploading…" : "Take photo"}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 w-full"
        disabled={isPending}
        onClick={openFilePicker}
      >
        <Upload className="h-4 w-4" />
        Upload photo or PDF
      </Button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="capture-tax-year" className="text-xs text-muted-foreground">
          Tax year (optional)
        </Label>
        <Select
          id="capture-tax-year"
          value={taxYearId}
          disabled={isPending}
          onChange={(e) => setTaxYearId(e.target.value)}
        >
          <option value="">Not sure yet</option>
          {taxYears.map((taxYear) => (
            <option key={taxYear.id} value={taxYear.id}>
              {taxYear.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
