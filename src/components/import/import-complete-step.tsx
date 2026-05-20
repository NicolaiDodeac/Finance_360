"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportTransactionsResult } from "@/lib/import/types";
import { CATEGORISE_ASSISTANT_PATH } from "@/lib/transactions/links";

interface ImportCompleteStepProps {
  result: ImportTransactionsResult;
  onImportAnother: () => void;
}

export function ImportCompleteStep({
  result,
  onImportAnother,
}: ImportCompleteStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold">Import complete</h2>
        <p className="text-sm text-muted-foreground">
          {result.imported} transaction{result.imported === 1 ? "" : "s"}{" "}
          imported
          {result.skipped_duplicates > 0 &&
            ` · ${result.skipped_duplicates} duplicate${result.skipped_duplicates === 1 ? "" : "s"} skipped`}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" variant="outline" onClick={onImportAnother}>
          Import another file
        </Button>
        {result.imported > 0 && (
          <Button type="button" variant="secondary" asChild>
            <Link href={CATEGORISE_ASSISTANT_PATH}>
              Categorise imported transactions
            </Link>
          </Button>
        )}
        <Button type="button" asChild>
          <Link href="/transactions">View transactions</Link>
        </Button>
      </div>
    </div>
  );
}
