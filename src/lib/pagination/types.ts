export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function parsePageParam(
  value: string | undefined,
  defaultPage = 1
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultPage;
  }
  return parsed;
}

export function paginationRange(
  page: number,
  pageSize: number,
  totalCount: number
): { from: number; to: number; startItem: number; endItem: number } {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = Math.min(from + pageSize - 1, Math.max(0, totalCount - 1));
  const startItem = totalCount === 0 ? 0 : from + 1;
  const endItem = totalCount === 0 ? 0 : Math.min(from + pageSize, totalCount);
  return { from, to, startItem, endItem };
}

export function formatShowingLabel(
  startItem: number,
  endItem: number,
  totalCount: number,
  noun: string
): string {
  if (totalCount === 0) {
    return `No ${noun}`;
  }
  if (totalCount <= endItem - startItem + 1 && startItem === 1) {
    return `${totalCount} ${totalCount === 1 ? noun.replace(/s$/, "") : noun}`;
  }
  return `Showing ${startItem}–${endItem} of ${totalCount} ${totalCount === 1 ? noun.replace(/s$/, "") : noun}`;
}

export function hasNextPage(
  page: number,
  pageSize: number,
  totalCount: number
): boolean {
  return page * pageSize < totalCount;
}

export function hasPreviousPage(page: number): boolean {
  return page > 1;
}
