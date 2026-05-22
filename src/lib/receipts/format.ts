export { formatMoney, formatTransactionDate } from "@/lib/transactions/format";

export function formatCount(
  count: number,
  singular: string,
  plural?: string
): string {
  const label = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${label}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Normalise stored dates for `<input type="date">` (expects YYYY-MM-DD). */
export function normalizeDateForInput(
  value: string | null | undefined
): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmy = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${month}-${day}`;
  }

  return trimmed;
}

export function formatAmountForInput(
  amount: number | null | undefined
): string {
  if (amount === null || amount === undefined) return "";
  return String(amount);
}
