"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  formatShowingLabel,
  hasNextPage,
  hasPreviousPage,
} from "@/lib/pagination/types";

interface ListPaginationControlsProps {
  page: number;
  pageSize: number;
  totalCount: number;
  /** Noun for the showing label, e.g. "transactions" */
  itemLabel?: string;
  /** URL search param key for page (default "page") */
  pageParam?: string;
  /** When true, mobile shows Load more instead of Next */
  loadMoreOnMobile?: boolean;
  isLoading?: boolean;
}

export function ListPaginationControls({
  page,
  pageSize,
  totalCount,
  itemLabel = "items",
  pageParam = "page",
  loadMoreOnMobile = true,
  isLoading = false,
}: ListPaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const loading = isLoading || isPending;
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);
  const showing = formatShowingLabel(startItem, endItem, totalCount, itemLabel);
  const canGoPrevious = hasPreviousPage(page);
  const canGoNext = hasNextPage(page, pageSize, totalCount);

  if (totalCount === 0) {
    return null;
  }

  function navigateToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete(pageParam);
    } else {
      params.set(pageParam, String(nextPage));
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  if (!canGoPrevious && !canGoNext) {
    return (
      <p className="text-center text-sm text-muted-foreground">{showing}</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      <p className="text-sm text-muted-foreground">{showing}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {canGoPrevious ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => navigateToPage(page - 1)}
            className={loadMoreOnMobile ? "hidden sm:inline-flex" : undefined}
          >
            Previous
          </Button>
        ) : null}

        {canGoNext ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => navigateToPage(page + 1)}
              className={loadMoreOnMobile ? "hidden sm:inline-flex" : undefined}
            >
              Next
            </Button>
            {loadMoreOnMobile ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => navigateToPage(page + 1)}
                className="sm:hidden"
              >
                {loading ? "Loading more…" : "Load more"}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

interface LoadMoreButtonProps {
  visibleCount: number;
  totalCount: number;
  batchSize: number;
  onLoadMore: () => void;
  isLoading?: boolean;
  itemLabel?: string;
}

/** Client-side load-more for lists that already have full data in memory. */
export function LoadMoreButton({
  visibleCount,
  totalCount,
  batchSize,
  onLoadMore,
  isLoading = false,
  itemLabel = "items",
}: LoadMoreButtonProps) {
  if (visibleCount >= totalCount) {
    if (totalCount === 0) return null;
    return (
      <p className="pt-4 text-center text-sm text-muted-foreground">
        {formatShowingLabel(1, totalCount, totalCount, itemLabel)}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 pt-4">
      <p className="text-sm text-muted-foreground">
        Showing {visibleCount} of {totalCount}{" "}
        {totalCount === 1 ? itemLabel.replace(/s$/, "") : itemLabel}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={onLoadMore}
      >
        {isLoading ? "Loading more…" : `Load more (${Math.min(batchSize, totalCount - visibleCount)} more)`}
      </Button>
    </div>
  );
}
