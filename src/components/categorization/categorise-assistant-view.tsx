"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  BusinessMerchantGroupCard,
  type CategoriseApplyFeedback,
} from "@/components/categorization/business-merchant-group-card";
import {
  CategoriseToast,
  type CategoriseToastMessage,
} from "@/components/categorization/categorise-toast";
import { Button } from "@/components/ui/button";
import type { MerchantGroup } from "@/lib/categorization/assistant-types";
import { splitMerchantGroup } from "@/lib/categorization/groups";
import {
  buildApplyToastMessages,
  FLOW_COPY,
  isIncomeDirection,
} from "@/lib/categorization/categorise-flow";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

const SKIPPED_STORAGE_KEY = "finance360_categorise_skipped";

interface CategoriseAssistantViewProps {
  initialGroups: MerchantGroup[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  reviewDeferredCount?: number;
}

function loadSkippedKeys(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = sessionStorage.getItem(SKIPPED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveSkippedKeys(keys: Set<string>): void {
  try {
    sessionStorage.setItem(
      SKIPPED_STORAGE_KEY,
      JSON.stringify(Array.from(keys))
    );
  } catch {
    /* ignore */
  }
}

export function CategoriseAssistantView({
  initialGroups,
  categories,
  hmrcCategories,
  reviewDeferredCount = 0,
}: CategoriseAssistantViewProps) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [skippedKeys, setSkippedKeys] = useState<Set<string>>(new Set());
  const [splitGroups, setSplitGroups] = useState<Map<string, MerchantGroup[]>>(
    () => new Map()
  );
  const [toast, setToast] = useState<CategoriseToastMessage | null>(null);

  useEffect(() => {
    setGroups(initialGroups);
    setSplitGroups(new Map());
  }, [initialGroups]);

  useEffect(() => {
    setSkippedKeys(loadSkippedKeys());
  }, []);

  const handleSkip = useCallback((groupKey: string) => {
    setSkippedKeys((prev) => {
      const next = new Set(prev);
      next.add(groupKey);
      saveSkippedKeys(next);
      return next;
    });
  }, []);

  const handleSplit = useCallback((group: MerchantGroup) => {
    setSplitGroups((prev) => {
      const next = new Map(prev);
      next.set(group.groupKey, splitMerchantGroup(group));
      return next;
    });
  }, []);

  const handleApplied = useCallback(
    (groupKey: string, feedback?: CategoriseApplyFeedback) => {
      setGroups((prev) => prev.filter((g) => g.groupKey !== groupKey));
      setSplitGroups((prev) => {
        const next = new Map(prev);
        for (const [parentKey, children] of next) {
          const remaining = children.filter((c) => c.groupKey !== groupKey);
          if (remaining.length === 0) {
            next.delete(parentKey);
          } else {
            next.set(parentKey, remaining);
          }
        }
        return next;
      });
      if (feedback) {
        const messages = buildApplyToastMessages(
          feedback.transactionCount,
          feedback.remembered,
          feedback.markReviewRecommended
        );
        setToast({
          id: `${groupKey}-${Date.now()}`,
          primary: messages.primary,
          secondary: messages.secondary,
        });
      }
      router.refresh();
    },
    [router]
  );

  const visibleGroups = useMemo(() => {
    const base = groups.filter((g) => !skippedKeys.has(g.groupKey));
    return base.flatMap((g) => {
      const split = splitGroups.get(g.groupKey);
      if (split?.length) return split;
      return [g];
    });
  }, [groups, skippedKeys, splitGroups]);

  const incomeGroups = useMemo(
    () => visibleGroups.filter((g) => isIncomeDirection(g.direction)),
    [visibleGroups]
  );

  const expenseGroups = useMemo(
    () => visibleGroups.filter((g) => !isIncomeDirection(g.direction)),
    [visibleGroups]
  );

  const groupsLeft = visibleGroups.length;

  if (groups.length === 0 && reviewDeferredCount === 0) {
    return <AllCaughtUpEmpty />;
  }

  if (groups.length === 0 && reviewDeferredCount > 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h2 className="text-xl font-semibold">Queue clear for now</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {reviewDeferredCount} transaction
          {reviewDeferredCount === 1 ? "" : "s"} marked for review — find them
          in Transactions when you are ready.
        </p>
        <Button type="button" asChild>
          <Link href="/transactions">Back to transactions</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <p className="text-lg font-semibold tabular-nums">
          {groupsLeft} group{groupsLeft === 1 ? "" : "s"} left
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {FLOW_COPY.tagline} Choose personal or business first — we handle tax
          categories where needed.
        </p>
        {reviewDeferredCount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {reviewDeferredCount} deferred for review in Transactions.
          </p>
        )}
      </div>

      {visibleGroups.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          You skipped all remaining groups for now.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setSkippedKeys(new Set());
              saveSkippedKeys(new Set());
            }}
          >
            Show skipped groups
          </button>
        </p>
      ) : (
        <>
          {incomeGroups.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Income
              </h2>
              {incomeGroups.map((group) => (
                <BusinessMerchantGroupCard
                  key={group.groupKey}
                  group={group}
                  categories={categories}
                  hmrcCategories={hmrcCategories}
                  onApplied={handleApplied}
                  onSkipped={handleSkip}
                  onSplit={
                    group.isCombined ? handleSplit : undefined
                  }
                />
              ))}
            </section>
          )}

          {expenseGroups.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Spending
              </h2>
              {expenseGroups.map((group) => (
                <BusinessMerchantGroupCard
                  key={group.groupKey}
                  group={group}
                  categories={categories}
                  hmrcCategories={hmrcCategories}
                  onApplied={handleApplied}
                  onSkipped={handleSkip}
                  onSplit={
                    group.isCombined ? handleSplit : undefined
                  }
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
    <CategoriseToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function AllCaughtUpEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-600" />
      <h2 className="text-xl font-semibold">All caught up</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Every transaction in the queue has a category. New imports will use your
        saved merchants when they match.
      </p>
      <Button type="button" asChild>
        <Link href="/transactions">Back to transactions</Link>
      </Button>
    </div>
  );
}
