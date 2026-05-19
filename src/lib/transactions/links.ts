import { getCalendarMonthBounds } from "@/lib/transactions/date-range";

export const UNCATEGORIZED_CATEGORY_FILTER = "uncategorized";

export function buildPersonalSpendingCategoryLink(
  categoryId: string | null,
  referenceDate: Date = new Date()
): string {
  const { from, to } = getCalendarMonthBounds(referenceDate);
  const params = new URLSearchParams({
    scope: "personal",
    direction: "expense",
    category: categoryId ?? UNCATEGORIZED_CATEGORY_FILTER,
    from,
    to,
  });
  return `/transactions?${params.toString()}`;
}
