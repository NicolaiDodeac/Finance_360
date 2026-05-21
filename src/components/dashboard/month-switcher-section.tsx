import { Suspense } from "react";
import { DashboardMonthSwitcher } from "@/components/dashboard/dashboard-month-switcher";
import type { DashboardMonthContext } from "@/lib/dashboard/month-context";

function MonthSwitcherFallback({ month }: { month: DashboardMonthContext }) {
  return (
    <div
      className="flex items-center justify-center gap-1 opacity-80"
      aria-hidden
    >
      <div className="h-9 w-9 shrink-0" />
      <p className="min-w-[9rem] text-center text-base font-medium tracking-tight">
        {month.label}
      </p>
      <div className="h-9 w-9 shrink-0" />
    </div>
  );
}

interface MonthSwitcherSectionProps {
  month: DashboardMonthContext;
  ariaLabel?: string;
}

/** Server wrapper: visible month label while client nav hydrates. */
export function MonthSwitcherSection({ month, ariaLabel }: MonthSwitcherSectionProps) {
  return (
    <Suspense fallback={<MonthSwitcherFallback month={month} />}>
      <DashboardMonthSwitcher month={month} ariaLabel={ariaLabel} />
    </Suspense>
  );
}
