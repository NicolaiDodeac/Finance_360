"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategorisationReviewContext } from "@/lib/categorization/review-types";

export interface UniversalCategorisationReviewProps {
  context: CategorisationReviewContext;
  onConfirm: () => void;
  confirmLabel?: string;
  disabled?: boolean;
  isPending?: boolean;
  /** Expanded change flow (purpose picker, category choices, etc.) */
  changePanel?: React.ReactNode;
  /** Advanced accounting fields (HMRC, VAT, tax year, notes, raw OCR) */
  advancedPanel?: React.ReactNode;
  /** Remember-this-choice block */
  rememberPanel?: React.ReactNode;
  footerNote?: string;
  /** Show category / purpose controls immediately (edit flows). */
  alwaysShowChange?: boolean;
}

export function UniversalCategorisationReview({
  context,
  onConfirm,
  confirmLabel = "Confirm",
  disabled,
  isPending,
  changePanel,
  advancedPanel,
  rememberPanel,
  footerNote = "You can change this anytime.",
  alwaysShowChange = false,
}: UniversalCategorisationReviewProps) {
  const [showChange, setShowChange] = useState(alwaysShowChange);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { detected, suggested, compactMode, hideAccountingByDefault } = context;

  if (compactMode && !showChange && !alwaysShowChange) {
    return (
      <div className="space-y-4">
        <CompactSummary
          detected={detected}
          suggested={suggested}
          usuallyNote={suggested.usuallyNote}
        />
        {rememberPanel}
        <Button
          type="button"
          className="h-14 w-full text-base"
          disabled={disabled || isPending}
          onClick={onConfirm}
        >
          {isPending ? "Saving…" : confirmLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={disabled || isPending}
          onClick={() => setShowChange(true)}
        >
          Change details
        </Button>
        <p className="text-center text-xs text-muted-foreground">{footerNote}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">
          {showChange || alwaysShowChange ? "Category" : "Review and confirm"}
        </h4>
        {!showChange && !alwaysShowChange && (
          <p className="mt-1 text-xs text-muted-foreground">
            Check what we detected — tap confirm when it looks right.
          </p>
        )}
      </div>

      {!showChange && !alwaysShowChange && (
        <>
          <DetectedBlock detected={detected} />
          <SuggestedBlock
            suggested={suggested}
            hideHmrc={hideAccountingByDefault}
          />
        </>
      )}

      {(showChange || alwaysShowChange) && changePanel ? (
        <div
          className={
            alwaysShowChange && !showChange
              ? "space-y-3"
              : "space-y-3 border-t border-border pt-3"
          }
        >
          {changePanel}
        </div>
      ) : null}

      {!showChange && !alwaysShowChange && advancedPanel && (
        <details
          className="group rounded-lg border border-border/80 bg-muted/20"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            Advanced details
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                showAdvanced && "rotate-180"
              )}
            />
          </summary>
          <div className="border-t border-border px-3 py-3">{advancedPanel}</div>
        </details>
      )}

      {rememberPanel}

      <div className="flex flex-col gap-2">
        {!showChange && !alwaysShowChange && (
          <Button
            type="button"
            className="h-12 w-full text-base"
            disabled={disabled || isPending}
            onClick={onConfirm}
          >
            {isPending ? "Saving…" : confirmLabel}
          </Button>
        )}
        {changePanel && !alwaysShowChange ? (
          <Button
            type="button"
            variant={showChange ? "ghost" : "outline"}
            className="h-11 w-full"
            disabled={disabled || isPending}
            onClick={() => setShowChange((v) => !v)}
          >
            {showChange ? "Back to summary" : "Change details"}
          </Button>
        ) : null}
        {alwaysShowChange && (
          <Button
            type="button"
            className="h-12 w-full text-base"
            disabled={disabled || isPending}
            onClick={onConfirm}
          >
            {isPending ? "Saving…" : confirmLabel}
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">{footerNote}</p>
    </div>
  );
}

function CompactSummary({
  detected,
  suggested,
  usuallyNote,
}: {
  detected: CategorisationReviewContext["detected"];
  suggested: CategorisationReviewContext["suggested"];
  usuallyNote?: string | null;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
      {detected.merchant ? (
        <p className="text-lg font-semibold leading-tight">{detected.merchant}</p>
      ) : null}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {detected.amount ? (
          <span className="tabular-nums text-foreground">{detected.amount}</span>
        ) : null}
        {detected.paymentMethod ? <span>{detected.paymentMethod}</span> : null}
        {detected.date ? <span>{detected.date}</span> : null}
      </div>
      <div className="space-y-1 border-t border-primary/15 pt-3">
        <p className="text-base font-medium text-foreground">
          {suggested.categoryLabel}
        </p>
        <p className="text-sm text-muted-foreground">
          {suggested.businessPersonalLabel}
        </p>
        {usuallyNote ? (
          <p className="text-xs text-muted-foreground">{usuallyNote}</p>
        ) : null}
        {suggested.taxNote ? (
          <p className="text-xs text-muted-foreground">{suggested.taxNote}</p>
        ) : null}
      </div>
    </div>
  );
}

function DetectedBlock({
  detected,
}: {
  detected: CategorisationReviewContext["detected"];
}) {
  const rows = [
    detected.merchant ? { label: "Merchant", value: detected.merchant } : null,
    detected.amount ? { label: "Amount", value: detected.amount } : null,
    detected.paymentMethod
      ? { label: "Payment", value: detected.paymentMethod }
      : null,
    detected.date ? { label: "Date", value: detected.date } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Detected
      </p>
      <dl className="grid gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SuggestedBlock({
  suggested,
  hideHmrc,
}: {
  suggested: CategorisationReviewContext["suggested"];
  hideHmrc: boolean;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Suggested
      </p>
      <dl className="grid gap-2 text-sm">
        {suggested.purposeLabel ? (
          <ReviewLine label="What was this for?" value={suggested.purposeLabel} />
        ) : null}
        <ReviewLine label="Category" value={suggested.categoryLabel} />
        <ReviewLine
          label="Personal or business"
          value={suggested.businessPersonalLabel}
        />
        {!hideHmrc && suggested.hmrcLabel ? (
          <ReviewLine label="Tax category" value={suggested.hmrcLabel} />
        ) : null}
      </dl>
      {suggested.usuallyNote ? (
        <p className="text-xs text-muted-foreground">{suggested.usuallyNote}</p>
      ) : null}
      {suggested.taxNote ? (
        <p className="text-xs text-muted-foreground">{suggested.taxNote}</p>
      ) : null}
      {suggested.evidenceNote ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Proof: </span>
          {suggested.evidenceNote}
        </p>
      ) : null}
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
