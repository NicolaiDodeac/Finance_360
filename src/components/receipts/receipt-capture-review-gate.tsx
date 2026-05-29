"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ReceiptCaptureReviewView } from "@/components/receipts/receipt-capture-review-view";
import { Button } from "@/components/ui/button";
import {
  markReceiptNeedsReview,
  runReceiptCaptureOcr,
} from "@/lib/receipts/capture-actions";
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

/** Hard ceiling: never let the user sit on the spinner longer than this. */
const WATCHDOG_MS = 30_000;

export function ReceiptCaptureReviewGate({
  review,
  categories,
  hmrcCategories,
  taxYears,
}: ReceiptCaptureReviewGateProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scanError, setScanError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const hasRunRef = useRef(false);

  const needsScan =
    review.receipt.status === "processing" ||
    review.receiptStatus === "processing";

  // Run OCR once, then always refresh so the page reflects the terminal status
  // (the server action guarantees the row leaves "processing").
  useEffect(() => {
    if (!needsScan) {
      hasRunRef.current = false;
      setTimedOut(false);
      return;
    }
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let cancelled = false;
    setScanError(null);

    startTransition(async () => {
      try {
        // Handled failures already moved the row to needs_review server-side;
        // the refresh below lands the user on the manual review panel.
        await runReceiptCaptureOcr(review.receipt.id);
      } catch {
        if (!cancelled) {
          setScanError(
            "We couldn't read this photo. Add the details manually or try again."
          );
        }
      } finally {
        // Refresh on every outcome — success, handled failure, or throw — so a
        // stale "processing" prop can't keep the spinner up.
        if (!cancelled) router.refresh();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [needsScan, review.receipt.id, router]);

  // Watchdog: if we are still processing after the ceiling, force the receipt
  // to needs_review and refresh so the user gets the manual path, never a
  // forever spinner.
  useEffect(() => {
    if (!needsScan) return;

    const timer = setTimeout(() => {
      setTimedOut(true);
      void markReceiptNeedsReview(
        review.receipt.id,
        "Reading the receipt took too long."
      ).finally(() => router.refresh());
    }, WATCHDOG_MS);

    return () => clearTimeout(timer);
  }, [needsScan, review.receipt.id, router]);

  function handleRetryScan() {
    setScanError(null);
    setTimedOut(false);
    hasRunRef.current = true;
    startTransition(async () => {
      try {
        await runReceiptCaptureOcr(review.receipt.id);
      } catch {
        setScanError(
          "We couldn't read this photo. Add the details manually or try again."
        );
      } finally {
        router.refresh();
      }
    });
  }

  function handleReviewManually() {
    startTransition(async () => {
      await markReceiptNeedsReview(
        review.receipt.id,
        "Reviewed manually before reading finished."
      );
      router.refresh();
    });
  }

  // Timed out but still processing → manual fallback, never an endless spinner.
  if (needsScan && timedOut) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10">
        <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          We couldn&apos;t finish reading this receipt. Your photo is saved as
          proof — you can still review it manually.
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
            onClick={handleReviewManually}
          >
            Review manually
          </Button>
        </div>
        <Button asChild variant="ghost" className="h-11 w-full">
          <Link href="/receipts">Continue later</Link>
        </Button>
      </div>
    );
  }

  // Still within the time budget → show the reading state.
  if (needsScan) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-lg font-medium">Still reading this receipt…</p>
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
        <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {scanError}
        </p>
        <p className="text-sm text-muted-foreground">
          You can retry the scan or enter details manually below.
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
            onClick={() => {
              setScanError(null);
              router.refresh();
            }}
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
