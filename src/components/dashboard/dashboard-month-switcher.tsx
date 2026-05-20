"use client";

import { useCallback, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  buildMonthContext,
  formatMonthParam,
  getNextMonth,
  getPreviousMonth,
  isFutureMonth,
  type DashboardMonthContext,
} from "@/lib/dashboard/month-context";

interface DashboardMonthSwitcherProps {
  month: DashboardMonthContext;
  /** Accessible name for the control group. */
  ariaLabel?: string;
}

export function DashboardMonthSwitcher({
  month,
  ariaLabel = "Dashboard month",
}: DashboardMonthSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const nextDisabled = isFutureMonth(
    getNextMonth(month.year, month.month).year,
    getNextMonth(month.year, month.month).month
  );

  const navigateToMonth = useCallback(
    (year: number, monthNumber: number) => {
      const params = new URLSearchParams(searchParams.toString());
      const next = buildMonthContext(year, monthNumber);

      if (next.isCurrentMonth) {
        params.delete("month");
      } else {
        params.set("month", formatMonthParam(year, monthNumber));
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams]
  );

  const goPrevious = () => {
    const prev = getPreviousMonth(month.year, month.month);
    navigateToMonth(prev.year, prev.month);
  };

  const goNext = () => {
    if (nextDisabled) return;
    const next = getNextMonth(month.year, month.month);
    navigateToMonth(next.year, next.month);
  };

  return (
    <div
      className={
        isPending
          ? "flex items-center justify-center gap-1 opacity-70 transition-opacity"
          : "flex items-center justify-center gap-1 transition-opacity"
      }
      role="group"
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={goPrevious}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <p className="min-w-[9rem] text-center text-base font-medium tracking-tight">
        {month.label}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={goNext}
        disabled={nextDisabled}
        aria-label="Next month"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

