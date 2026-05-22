"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  repairCategorizationRulesAction,
} from "@/lib/categorization/rule-repair-actions";

interface RulesRepairBannerProps {
  repairableCount: number;
}

export function RulesRepairBanner({ repairableCount }: RulesRepairBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApplyOffer, setShowApplyOffer] = useState(false);
  const [lastRepaired, setLastRepaired] = useState(0);

  if (repairableCount <= 0 && !showApplyOffer) {
    return message || error ? (
      <RepairFeedback message={message} error={error} />
    ) : null;
  }

  function runRepair(applyToMatchingTransactions: boolean) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await repairCategorizationRulesAction({
        applyToMatchingTransactions,
      });

      if (!result.success) {
        setError(result.error ?? "Could not improve rules.");
        setShowApplyOffer(false);
        return;
      }

      const { repairedCount, skippedCount, transactionsUpdated } = result.data!;
      setLastRepaired(repairedCount);

      if (repairedCount === 0) {
        setMessage("No rules were updated — nothing matched our safe mapping.");
        setShowApplyOffer(false);
      } else if (applyToMatchingTransactions) {
        setMessage(
          `Improved ${repairedCount} rule${repairedCount === 1 ? "" : "s"}` +
            (transactionsUpdated > 0
              ? ` and applied them to ${transactionsUpdated} matching transaction${transactionsUpdated === 1 ? "" : "s"}.`
              : ". No matching uncategorised transactions needed updating.") +
            (skippedCount > 0
              ? ` ${skippedCount} rule${skippedCount === 1 ? " was" : "s were"} left unchanged.`
              : "")
        );
        setShowApplyOffer(false);
      } else {
        setMessage(
          `Improved ${repairedCount} saved rule${repairedCount === 1 ? "" : "s"} with tax categories.` +
            (skippedCount > 0
              ? ` ${skippedCount} could not be mapped safely and were left as they are.`
              : "")
        );
        setShowApplyOffer(true);
      }

      router.refresh();
    });
  }

  return (
    <div className="mb-6 space-y-3">
      {repairableCount > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 dark:bg-primary/10">
          <p className="text-sm font-medium text-foreground">
            Improve saved rules
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Some saved rules can be improved with tax categories. We can add
            HMRC labels from your categories and past categorisations — only
            where the mapping is clear.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => runRepair(false)}
            >
              {isPending ? "Working…" : "Repair rules"}
            </Button>
          </div>
        </div>
      )}

      {showApplyOffer && lastRepaired > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Apply repaired rules to existing uncategorised matching transactions?
            Only expense rows with no category yet and a clear keyword match are
            updated.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={isPending}
            onClick={() => runRepair(true)}
          >
            {isPending ? "Applying…" : "Apply to matching transactions"}
          </Button>
        </div>
      )}

      <RepairFeedback message={message} error={error} />
    </div>
  );
}

function RepairFeedback({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  if (!message && !error) {
    return null;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </p>
    );
  }

  return (
    <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {message}
    </p>
  );
}
