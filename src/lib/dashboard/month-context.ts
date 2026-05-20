const MONTH_PARAM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface MonthParts {
  year: number;
  month: number;
}

export interface DashboardMonthContext extends MonthParts {
  /** URL param value, e.g. `2026-05`. */
  param: string;
  /** Display label, e.g. `May 2026`. */
  label: string;
  from: string;
  to: string;
  isCurrentMonth: boolean;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function getMonthBounds(year: number, month: number): { from: string; to: string } {
  return {
    from: formatIsoDate(new Date(year, month - 1, 1)),
    to: formatIsoDate(new Date(year, month, 0)),
  };
}

export function getPreviousMonth(year: number, month: number): MonthParts {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export function getNextMonth(year: number, month: number): MonthParts {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

export function isFutureMonth(
  year: number,
  month: number,
  referenceDate: Date = new Date()
): boolean {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;
  return year > refYear || (year === refYear && month > refMonth);
}

export function buildMonthContext(
  year: number,
  month: number,
  referenceDate: Date = new Date()
): DashboardMonthContext {
  const bounds = getMonthBounds(year, month);
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;

  return {
    year,
    month,
    param: formatMonthParam(year, month),
    label: formatMonthLabel(year, month),
    from: bounds.from,
    to: bounds.to,
    isCurrentMonth: year === refYear && month === refMonth,
  };
}

/** Parse `?month=2026-05`; defaults to the calendar month of `referenceDate`. */
export function parseMonthParam(
  value: string | undefined,
  referenceDate: Date = new Date()
): DashboardMonthContext {
  if (!value || !MONTH_PARAM_RE.test(value)) {
    return buildMonthContext(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      referenceDate
    );
  }

  const [yearStr, monthStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (isFutureMonth(year, month, referenceDate)) {
    return buildMonthContext(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      referenceDate
    );
  }

  return buildMonthContext(year, month, referenceDate);
}

export function monthReferenceDate(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export function isTransactionInMonth(
  isoDate: string,
  year: number,
  month: number
): boolean {
  const [y, m] = isoDate.split("-").map(Number);
  return y === year && m === month;
}

/** Budget page path preserving month context. */
export function buildBudgetHref(
  month: Pick<DashboardMonthContext, "param" | "isCurrentMonth">
): string {
  if (month.isCurrentMonth) return "/budget";
  return `/budget?month=${month.param}`;
}

export function toBudgetPeriod(
  month: Pick<DashboardMonthContext, "year" | "month" | "label">
): { year: number; month: number; label: string } {
  return { year: month.year, month: month.month, label: month.label };
}
