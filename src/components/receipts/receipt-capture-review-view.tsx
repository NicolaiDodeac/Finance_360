"use client";

import { useMemo, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Search } from "lucide-react";
import { ReceiptSimilarBanner } from "@/components/receipts/receipt-similar-banner";
import {
  MatchTransactionCard,
  ReceiptMatchActions,
} from "@/components/receipts/receipt-match-actions";
import { ReceiptAttachPanel } from "@/components/receipts/receipt-attach-panel";
import { ReceiptCategorisationReview } from "@/components/receipts/receipt-categorisation-review";
import { ReceiptNeedsReviewPanel } from "@/components/receipts/receipt-needs-review-panel";
import { ReceiptFileIcon } from "@/components/receipts/receipt-file-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ReceiptDeleteButton,
  confirmDeleteReceipt,
} from "@/components/receipts/receipt-delete-button";
import {
  attachReceiptToTransaction,
  deleteReceipt,
  getReceiptPreviewUrl,
  updateReceiptMetadata,
} from "@/lib/receipts/actions";
import { createTransactionFromReceipt } from "@/lib/receipts/capture-actions";
import {
  classifyReceiptText,
  type ReceiptPurpose,
} from "@/lib/receipts/classify";
import {
  formatMoney,
  formatTransactionDate,
} from "@/lib/receipts/format";
import { buildReceiptCreationSuggestion } from "@/lib/receipts/suggest";
import type {
  ReceiptCaptureReviewData,
  ReceiptMatchCandidate,
} from "@/lib/receipts/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import { showsBusinessFeatures } from "@/lib/profile/types";
import type { ReceiptPaymentMethod } from "@/types/database";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface ReceiptCaptureReviewViewProps {
  review: ReceiptCaptureReviewData;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  taxYears?: TaxYearRow[];
}

const PURPOSE_OPTIONS: { value: ReceiptPurpose; label: string }[] = [
  { value: "personal", label: "Personal purchase" },
  { value: "business", label: "Business purchase" },
  { value: "not_sure", label: "Not sure" },
];

export function ReceiptCaptureReviewView({
  review,
  categories,
  hmrcCategories,
}: ReceiptCaptureReviewViewProps) {
  const router = useRouter();
  const {
    receipt,
    receiptStatus,
    extraction,
    suggestedMatch,
    closestMatch,
    financeMode,
    similarReceipts,
  } = review;
  const reviewLevel = extraction.reviewLevel ?? "medium";
  const uncertainHint = buildUncertainHint(extraction);
  const isDev = process.env.NODE_ENV === "development";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [purpose, setPurpose] = useState<ReceiptPurpose>(
    review.creationSuggestion.purposeDefault
  );
  const [payment, setPayment] = useState<ReceiptPaymentMethod | null>(
    receipt.payment_method
  );

  const showBusinessPurpose = showsBusinessFeatures(financeMode);
  const hasBankMatch = Boolean(suggestedMatch);

  const suggestion = useMemo(
    () =>
      buildReceiptCreationSuggestion({
        financeMode,
        merchant: receipt.merchant_name,
        rawText: extraction.rawText,
        paymentMethod: payment,
        purpose,
        categories,
        hmrcCategories,
      }),
    [
      financeMode,
      receipt.merchant_name,
      extraction.rawText,
      payment,
      purpose,
      categories,
      hmrcCategories,
    ]
  );

  const needsPayment =
    review.showPaymentPrompt && (!payment || payment === "unknown");

  const mayBeIncome = useMemo(
    () =>
      classifyReceiptText(receipt.merchant_name, extraction.rawText).mayBeIncome,
    [receipt.merchant_name, extraction.rawText]
  );

  function handleCreateIncome(kind: "cash_income" | "business_income") {
    setError(null);
    startTransition(async () => {
      const result = await createTransactionFromReceipt(receipt.id, {
        purpose: kind === "business_income" ? "business" : "personal",
        payment_method: payment,
        record_as_income: true,
        income_kind: kind,
      });
      if (!result.success) {
        setError(result.error ?? "Could not save.");
        return;
      }
      router.push("/receipts");
      router.refresh();
    });
  }

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

  const attached = receipt.attached_transaction;

  function handleLinkMatch(
    match: ReceiptMatchCandidate,
    replaceExistingProof = false
  ) {
    setError(null);
    startTransition(async () => {
      const result = await attachReceiptToTransaction(
        receipt.id,
        match.transaction.id,
        { replaceExistingProof }
      );
      if (!result.success) {
        if (result.data?.outcome === "existing_proof") {
          setError(
            `This transaction already has proof (${result.data.existingLabel}). Choose Replace proof below if you want this scan instead.`
          );
        } else {
          setError(result.error ?? "Could not link receipt.");
        }
        return;
      }
      if (result.data?.outcome === "already_linked") {
        router.push("/receipts");
        router.refresh();
        return;
      }
      router.push("/receipts");
      router.refresh();
    });
  }

  function handleCreateAndLink() {
    setError(null);
    startTransition(async () => {
      const result = await createTransactionFromReceipt(receipt.id, {
        purpose,
        payment_method: payment,
      });
      if (!result.success) {
        setError(result.error ?? "Could not save.");
        return;
      }
      router.push("/receipts");
      router.refresh();
    });
  }

  function handleSkip() {
    router.push("/receipts");
  }

  function handleDelete() {
    if (!confirmDeleteReceipt()) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteReceipt(receipt.id);
      if (!result.success) {
        setError(result.error ?? "Could not delete receipt.");
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

  if (receiptStatus === "needs_review" && !attached) {
    return <ReceiptNeedsReviewPanel receipt={receipt} />;
  }

  if (attached) {
    return (
      <div className="space-y-4">
        <ProofBanner />
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="font-medium text-emerald-900 dark:text-emerald-200">
            Linked and saved
          </p>
          <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-300/90">
            {attached.merchant_name ?? attached.description ?? "Transaction"} ·{" "}
            {formatMoney(Number(attached.amount))}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/receipts">Done</Link>
        </Button>
        <ReceiptDeleteButton onDelete={handleDelete} disabled={isPending} />
      </div>
    );
  }

  const amountLabel =
    receipt.total_amount !== null
      ? formatMoney(Number(receipt.total_amount))
      : "Amount needed";

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      <ProofBanner />

      {uncertainHint ? (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground">
          {uncertainHint}
        </p>
      ) : null}

      <ReceiptSimilarBanner
        similarReceipts={similarReceipts}
        onDeleteCurrent={handleDelete}
        deleteDisabled={isPending}
      />

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        We found these details
      </p>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <ReceiptFileIcon mimeType={receipt.mime_type} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {receipt.merchant_name ?? receipt.original_filename ?? "Receipt"}
          </p>
          <p className="text-xs text-muted-foreground">
            {amountLabel}
            {receipt.receipt_date
              ? ` · ${formatTransactionDate(receipt.receipt_date)}`
              : ""}
          </p>
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View photo
            </a>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <ReceiptDeleteButton
            variant="inline"
            onDelete={handleDelete}
            disabled={isPending}
          />
        </div>
      </div>
      </div>

      {editing ? (
        <form
          onSubmit={handleMetadataSubmit}
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
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
          <input
            type="hidden"
            name="tax_year_id"
            value={receipt.tax_year_id ?? ""}
          />
          <input type="hidden" name="notes" value={receipt.notes ?? ""} />
          <input
            type="hidden"
            name="payment_method"
            value={payment ?? ""}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            Save details
          </Button>
        </form>
      ) : null}

      {showBusinessPurpose && reviewLevel !== "high" ? (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium">What was this for?</p>
          <div className="grid gap-2">
            {PURPOSE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary"
              >
                <input
                  type="radio"
                  name="purpose"
                  value={opt.value}
                  checked={purpose === opt.value}
                  disabled={isPending}
                  onChange={() => setPurpose(opt.value)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {needsPayment ? (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium">How did you pay?</p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "cash" as const, label: "Cash" },
                { value: "card" as const, label: "Card" },
                { value: "unknown" as const, label: "Other" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={payment === opt.value ? "default" : "outline"}
                className="h-12"
                disabled={isPending}
                onClick={() => setPayment(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {hasBankMatch ? (
        <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium">
            {suggestedMatch?.linkState === "linked_to_other_receipt"
              ? "Matching transaction found"
              : "Possible match found"}
          </p>
          {suggestedMatch?.linkState === "linked_to_other_receipt" ? (
            <p className="text-xs text-muted-foreground">
              This looks like a transaction you already saved proof for. You can
              replace it with this scan or keep the existing file.
            </p>
          ) : null}
          <MatchTransactionCard match={suggestedMatch!} />
          {isDev ? <MatchDebugPanel match={suggestedMatch!} /> : null}
          <ReceiptMatchActions
            match={suggestedMatch!}
            disabled={needsPayment}
            isPending={isPending}
            onLink={(replace) => handleLinkMatch(suggestedMatch!, replace)}
            onCancel={() => router.push("/receipts")}
          />
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full"
            disabled={isPending || needsPayment}
            onClick={handleCreateAndLink}
          >
            Create separate transaction instead
          </Button>
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
            <p className="text-sm font-medium">No confident match found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {similarReceipts.some((s) => s.hasLinkedTransaction)
                ? "A similar receipt is already linked to a transaction — open it above, or create a new entry below."
                : "We could not find a transaction that closely matches this receipt."}
            </p>
          </section>

          {closestMatch ? (
            <section className="space-y-3 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-sm font-medium">Closest transaction</p>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
                Review carefully — amount or merchant does not fully match.
              </p>
              <MatchTransactionCard match={closestMatch} />
              {isDev ? <MatchDebugPanel match={closestMatch} /> : null}
              <ReceiptMatchActions
                match={closestMatch}
                disabled={needsPayment}
                isPending={isPending}
                linkLabel="Link anyway"
                onLink={(replace) => handleLinkMatch(closestMatch, replace)}
                onCancel={() => setError(null)}
              />
            </section>
          ) : null}

          <ReceiptCategorisationReview
            merchant={receipt.merchant_name}
            amount={
              receipt.total_amount !== null
                ? Number(receipt.total_amount)
                : null
            }
            receiptDate={receipt.receipt_date}
            paymentLabel={suggestion.paymentLabel}
            purpose={purpose}
            suggestion={suggestion}
            categories={categories}
            hmrcCategories={hmrcCategories}
            disabled={
              isPending ||
              needsPayment ||
              receipt.total_amount === null ||
              !receipt.receipt_date
            }
            isPending={isPending}
            onConfirm={handleCreateAndLink}
            purposePanel={
              showBusinessPurpose ? (
                <div className="grid gap-2">
                  {PURPOSE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3 has-[:checked]:border-primary"
                    >
                      <input
                        type="radio"
                        name="purpose-change"
                        value={opt.value}
                        checked={purpose === opt.value}
                        disabled={isPending}
                        onChange={() => setPurpose(opt.value)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              ) : undefined
            }
          />
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full"
            disabled={isPending}
            onClick={handleSkip}
          >
            Continue later
          </Button>
        </>
      )}

      {mayBeIncome ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start px-0 text-sm font-medium"
            onClick={() => setShowIncome((v) => !v)}
          >
            Received money on this receipt?
          </Button>
          {showIncome ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Only choose this if you were paid — we will not guess business
                turnover for you.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isPending || needsPayment}
                onClick={() => handleCreateIncome("cash_income")}
              >
                Cash income (personal)
              </Button>
              {showBusinessPurpose ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isPending || needsPayment}
                  onClick={() => handleCreateIncome("business_income")}
                >
                  Business income / turnover
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => setShowSearch((v) => !v)}
      >
        <Search className="h-4 w-4" />
        {showSearch ? "Hide search" : "Search manually"}
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

      <div className="space-y-2 border-t border-border pt-4">
        <ReceiptDeleteButton onDelete={handleDelete} disabled={isPending} />
        <Button asChild variant="ghost" className="h-11 w-full">
          <Link href="/receipts">Back to receipts</Link>
        </Button>
      </div>
    </div>
  );
}

function ProofBanner() {
  return (
    <p className="rounded-lg bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground">
      Receipt saved as proof.
    </p>
  );
}

/**
 * Fast review hint. High confidence shows nothing (single-tap confirm).
 * Medium confidence highlights only the one field worth checking.
 */
function buildUncertainHint(
  extraction: ReceiptCaptureReviewData["extraction"]
): string | null {
  if (extraction.reviewLevel !== "medium") return null;

  const fc = extraction.fieldConfidence;
  if (!fc) return null;

  if (fc.merchant === "low") return "Check this one field: the merchant.";
  if (fc.total === "low") return "Check this one field: the amount.";
  if (fc.date === "low") return "Check this one field: the date.";
  if (fc.payment === "low") return "Check the payment method below.";
  return "Quick check — confirm the details look right.";
}

function MatchDebugPanel({ match }: { match: ReceiptMatchCandidate }) {
  const { debug } = match;
  if (process.env.NODE_ENV !== "development") return null;

  console.info("[receipt-match]", {
    merchant: match.transaction.merchant_name ?? match.transaction.description,
    amountDiff: debug.amountDiff,
    dateDiff: debug.dateDiff,
    merchantTier: debug.merchantTier,
    amountTier: debug.amountTier,
    dateTier: debug.dateTier,
    finalConfidence: debug.finalConfidence,
    compositeScore: debug.compositeScore,
  });

  return (
    <pre className="overflow-x-auto rounded-md bg-muted/60 p-2 text-[10px] leading-relaxed text-muted-foreground">
      {`match debug
amount diff: ${debug.amountDiff ?? "—"} (${debug.amountTier})
date diff: ${debug.dateDiff ?? "—"} days (${debug.dateTier})
merchant: ${debug.merchantTier}
confidence: ${debug.finalConfidence}
score: ${debug.compositeScore}`}
    </pre>
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
