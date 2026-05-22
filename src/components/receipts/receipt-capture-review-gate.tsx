"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ReceiptCaptureReviewView } from "@/components/receipts/receipt-capture-review-view";
import { Button } from "@/components/ui/button";
import { runReceiptCaptureOcr } from "@/lib/receipts/capture-actions";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { ReceiptCaptureReviewData } from "@/lib/receipts/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptCaptureReviewGateProps {
  review: ReceiptCaptureReviewData;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  taxYears?: TaxYearRow[];
}

export function ReceiptCaptureReviewGate({
  review,
  categories,
  hmrcCategories,
  taxYears,
}: ReceiptCaptureReviewGateProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scanError, setScanError] = useState<string | null>(null);

  const needsScan =
    review.receipt.status === "processing" ||
    review.receiptStatus === "processing";

  useEffect(() => {
    if (!needsScan) return;

    let cancelled = false;
    setScanError(null);

    startTransition(async () => {
      try {
        const result = await runReceiptCaptureOcr(review.receipt.id);
        if (cancelled) return;
        if (!result.success) {
          setScanError(result.error ?? "Could not read this receipt.");
          return;
        }
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          setScanError(
            err instanceof Error ? err.message : "Could not scan receipt."
          );
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [needsScan, review.receipt.id, router]);

  function handleRetryScan() {
    setScanError(null);
    startTransition(async () => {
      try {
        const result = await runReceiptCaptureOcr(review.receipt.id);
        if (!result.success) {
          setScanError(result.error ?? "Could not read this receipt.");
          return;
        }
        router.refresh();
      } catch (err) {
        setScanError(
          err instanceof Error ? err.message : "Could not scan receipt."
        );
      }
    });
  }

  if (needsScan || (scanError && isPending)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-lg font-medium">Reading your receipt…</p>
          <p className="text-sm text-muted-foreground">
            This usually takes a few seconds. Keep this tab open.
          </p>
        </div>
      </div>
    );
  }

  if (scanError) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {scanError}
        </p>
        <p className="text-sm text-muted-foreground">
          You can retry the scan or enter details manually on the next screen.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            disabled={isPending}
            onClick={handleRetryScan}
          >
            {isPending ? "Scanning…" : "Try scan again"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={() => router.refresh()}
          >
            Enter details manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ReceiptCaptureReviewView
      review={review}
      categories={categories}
      hmrcCategories={hmrcCategories}
      taxYears={taxYears}
    />
  );
}
