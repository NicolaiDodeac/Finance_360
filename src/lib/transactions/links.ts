import { getCalendarMonthBounds } from "@/lib/transactions/date-range";

export const UNCATEGORIZED_CATEGORY_FILTER = "uncategorized";

export const CATEGORISE_ASSISTANT_PATH = "/transactions/categorise";

export function buildPersonalSpendingCategoryLink(
  categoryId: string | null,
  referenceDate: Date = new Date()
): string {
  const { from, to } = getCalendarMonthBounds(referenceDate);
  return buildTransactionsFilterLink(
    {
      scope: "personal",
      direction: "expense",
      category: categoryId ?? UNCATEGORIZED_CATEGORY_FILTER,
    },
    { from, to }
  );
}

export function buildTransactionsFilterLink(
  filters: Record<string, string>,
  monthBounds: { from: string; to: string }
): string {
  const params = new URLSearchParams({
    ...filters,
    from: monthBounds.from,
    to: monthBounds.to,
  });
  return `/transactions?${params.toString()}`;
}
