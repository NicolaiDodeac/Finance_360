import {
  type DashboardMonthContext,
  formatMonthLabel,
} from "@/lib/dashboard/month-context";
import { formatDateRangeChipLabel } from "@/lib/transactions/date-range";

export interface QuickAddDateContext {
  /** ISO date applied to new drafts. */
  defaultDate: string;
  minDate?: string;
  maxDate?: string;
  /** e.g. "Adding to May 2026" */
  helperLabel?: string;
  /** Past dashboard month: user can switch to today instead of month end. */
  allowAlternateToday?: boolean;
  alternateTodayDate?: string;
}

function formatTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clampDateToRange(
  date: string,
  from: string | undefined,
  to: string | undefined
): string {
  if (from && date < from) return from;
  if (to && date > to) return to;
  return date;
}

/** Pick a default date that falls within an optional from/to filter. */
export function defaultDateInFilterRange(
  from: string | undefined,
  to: string | undefined,
  referenceDate: string = formatTodayIso()
): string {
  return clampDateToRange(referenceDate, from, to);
}

export function buildQuickAddDateContextFromMonth(
  month: Pick<
    DashboardMonthContext,
    "year" | "month" | "label" | "from" | "to" | "isCurrentMonth"
  >
): QuickAddDateContext {
  const today = formatTodayIso();

  if (month.isCurrentMonth) {
    return {
      defaultDate: today,
      helperLabel: `Adding to ${month.label}`,
    };
  }

  return {
    defaultDate: month.to,
    minDate: month.from,
    maxDate: month.to,
    helperLabel: `Adding to ${month.label}`,
    allowAlternateToday: true,
    alternateTodayDate: today,
  };
}

export function buildQuickAddDateContextFromFilter(
  from: string | undefined,
  to: string | undefined
): QuickAddDateContext | null {
  if (!from && !to) {
    return null;
  }

  const defaultDate = defaultDateInFilterRange(from, to);
  let helperLabel: string;

  if (from && to) {
    const fromMonth = from.slice(0, 7);
    const toMonth = to.slice(0, 7);
    if (fromMonth === toMonth && from === `${fromMonth}-01`) {
      const [y, m] = fromMonth.split("-").map(Number);
      helperLabel = `Adding to ${formatMonthLabel(y, m)}`;
    } else {
      helperLabel = `Adding within ${formatDateRangeChipLabel(from, to)}`;
    }
  } else if (from) {
    helperLabel = `Adding from ${formatDateRangeChipLabel(from, from)}`;
  } else {
    helperLabel = `Adding up to ${formatDateRangeChipLabel(to!, to!)}`;
  }

  return {
    defaultDate,
    minDate: from,
    maxDate: to,
    helperLabel,
  };
}
