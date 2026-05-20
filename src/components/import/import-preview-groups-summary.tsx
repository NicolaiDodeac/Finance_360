"use client";

import { Badge } from "@/components/ui/badge";
import type { ImportPreviewMerchantGroup } from "@/lib/import/preview-groups";
import { formatMoney } from "@/lib/transactions/format";

interface ImportPreviewGroupsSummaryProps {
  groups: ImportPreviewMerchantGroup[];
  uncategorisedNewCount: number;
}

export function ImportPreviewGroupsSummary({
  groups,
  uncategorisedNewCount,
}: ImportPreviewGroupsSummaryProps) {
  if (groups.length === 0 && uncategorisedNewCount === 0) {
    return null;
  }

  const withSuggestions = groups.filter((g) => g.suggestion);

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-sm font-medium">Similar transactions grouped</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {uncategorisedNewCount} new transaction
        {uncategorisedNewCount === 1 ? "" : "s"} still need a category after
        import. You can categorise in bulk once saved.
      </p>

      {withSuggestions.length > 0 && (
        <ul className="mt-3 space-y-2">
          {withSuggestions.slice(0, 6).map((group) => (
            <li
              key={group.groupKey}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{group.merchantLabel}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {group.newCount}×
                </span>
              </span>
              {group.suggestion && (
                <span className="text-muted-foreground">
                  Suggested: {group.suggestion.categoryName}
                  {group.suggestion.confidence === "high" && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      High confidence
                    </Badge>
                  )}
                  <span className="ml-2">{formatMoney(group.totalAmount)}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Import first to keep your data safe — then use the categorisation
        assistant to teach Finance 360 once.
      </p>
    </div>
  );
}
