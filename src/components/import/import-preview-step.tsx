"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  directionLabel,
  formatMoney,
  formatTransactionDate,
} from "@/lib/transactions/format";
import type { ImportPreviewRow } from "@/lib/import/types";

interface ImportPreviewStepProps {
  rows: ImportPreviewRow[];
  adapterLabel: string;
  fileName: string;
  warnings: string[];
  isImporting: boolean;
  error: string | null;
  onBack: () => void;
  onImport: () => void;
}

function statusBadge(status: ImportPreviewRow["status"]) {
  switch (status) {
    case "new":
      return <Badge variant="secondary">New</Badge>;
    case "duplicate":
      return <Badge variant="muted">Duplicate</Badge>;
    case "duplicate_in_file":
      return <Badge variant="muted">Duplicate in file</Badge>;
    default:
      return null;
  }
}

export function ImportPreviewStep({
  rows,
  adapterLabel,
  fileName,
  warnings,
  isImporting,
  error,
  onBack,
  onImport,
}: ImportPreviewStepProps) {
  const newCount = rows.filter((r) => r.status === "new").length;
  const duplicateCount = rows.length - newCount;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <p>
          <span className="font-medium">{fileName}</span>
          <span className="text-muted-foreground"> · {adapterLabel}</span>
        </p>
        <p className="mt-1 text-muted-foreground">
          {newCount} new · {duplicateCount} skipped as duplicates
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Parser notes</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {warnings.slice(0, 5).map((warning, index) => (
              <li key={`warning-${index}`}>{warning}</li>
            ))}
            {warnings.length > 5 && (
              <li>…and {warnings.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.preview_id}
                  className={
                    row.status !== "new"
                      ? "bg-muted/20 text-muted-foreground"
                      : "border-t border-border"
                  }
                >
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {formatTransactionDate(row.date)}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-2.5">
                    {row.description}
                  </td>
                  <td className="px-4 py-2.5">
                    {directionLabel(row.direction)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium">
                    {formatMoney(row.amount)}
                  </td>
                  <td className="max-w-[140px] px-4 py-2.5">
                    {row.matched_rule_name ? (
                      <span className="text-xs text-muted-foreground" title="Assigned by rule">
                        {row.matched_rule_name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{statusBadge(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" disabled={isImporting} onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={isImporting || newCount === 0}
          onClick={onImport}
        >
          {isImporting
            ? "Importing…"
            : `Import ${newCount} transaction${newCount === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
