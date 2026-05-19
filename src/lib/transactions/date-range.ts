const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Validates and returns a YYYY-MM-DD string, or undefined if invalid. */
export function parseIsoDateParam(
  value: string | undefined
): string | undefined {
  if (!value || !ISO_DATE_RE.test(value)) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return value;
}

export function getCalendarMonthBounds(
  referenceDate: Date = new Date()
): { from: string; to: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  return {
    from: formatIsoDate(new Date(year, month, 1)),
    to: formatIsoDate(new Date(year, month + 1, 0)),
  };
}

export function formatDateRangeChipLabel(from: string, to: string): string {
  const fromDate = parseLocalIsoDate(from);
  const toDate = parseLocalIsoDate(to);

  if (from === to) {
    return fromDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (from.slice(0, 7) === to.slice(0, 7)) {
    return fromDate.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }

  const dayMonth: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const dayMonthYear: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${fromDate.toLocaleDateString("en-GB", dayMonth)} – ${toDate.toLocaleDateString("en-GB", dayMonthYear)}`;
  }

  return `${fromDate.toLocaleDateString("en-GB", dayMonthYear)} – ${toDate.toLocaleDateString("en-GB", dayMonthYear)}`;
}
