"use client";

import { useState, useTransition } from "react";
import {
  ImportStepIndicator,
  type ImportWizardStep,
} from "@/components/import/import-step-indicator";
import { ImportCompleteStep } from "@/components/import/import-complete-step";
import { ImportPreviewStep } from "@/components/import/import-preview-step";
import { ImportUploadStep } from "@/components/import/import-upload-step";
import {
  importTransactions,
  parseImportPreview,
  type ParseImportPreviewResult,
} from "@/lib/import/actions";
import type { AccountRow } from "@/lib/accounts/queries";
import type { ImportTransactionsResult } from "@/lib/import/types";

interface ImportWizardProps {
  accounts: AccountRow[];
  defaultAccountId: string;
}

export function ImportWizard({ accounts, defaultAccountId }: ImportWizardProps) {
  const [step, setStep] = useState<ImportWizardStep>("upload");
  const [parseResult, setParseResult] = useState<ParseImportPreviewResult | null>(
    null
  );
  const [importResult, setImportResult] =
    useState<ImportTransactionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, startParse] = useTransition();
  const [isImporting, startImport] = useTransition();

  const reset = () => {
    setStep("upload");
    setParseResult(null);
    setImportResult(null);
    setError(null);
  };

  const handleParse = (accountId: string, file: File) => {
    setError(null);
    const formData = new FormData();
    formData.set("account_id", accountId);
    formData.set("file", file);

    startParse(async () => {
      try {
        const result = await parseImportPreview(formData);
        if (!result.success || !result.data) {
          setError(result.error ?? "Failed to parse file.");
          return;
        }
        setParseResult(result.data);
        setStep("preview");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not parse the file. Try again or use a smaller statement."
        );
      }
    });
  };

  const handleImport = () => {
    if (!parseResult) return;

    setError(null);
    const rowsToImport = parseResult.preview_rows.filter(
      (row) => row.status === "new"
    );

    startImport(async () => {
      try {
        const result = await importTransactions({
          account_id: parseResult.account_id,
          adapter_id: parseResult.adapterId,
          file_name: parseResult.fileName,
          rows: rowsToImport.map((row) => ({
            import_key: row.import_key,
            date: row.date,
            description: row.description,
            merchant_name: row.merchant_name,
            amount: row.amount,
            direction: row.direction,
            balance: row.balance,
            raw_import_data: row.raw_import_data,
            category_id: row.category_id,
            hmrc_category_id: row.hmrc_category_id,
            is_business: row.is_business,
          })),
        });

        if (!result.success || !result.data) {
          setError(result.error ?? "Import failed.");
          return;
        }

        setImportResult(result.data);
        setStep("done");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Import failed. Please try again."
        );
      }
    });
  };

  return (
    <div>
      <ImportStepIndicator current={step} />

      {step === "upload" && (
        <ImportUploadStep
          accounts={accounts}
          defaultAccountId={defaultAccountId}
          isParsing={isParsing}
          error={error}
          onParse={handleParse}
        />
      )}

      {step === "preview" && parseResult && (
        <ImportPreviewStep
          rows={parseResult.preview_rows}
          adapterLabel={parseResult.adapterLabel}
          fileName={parseResult.fileName}
          warnings={parseResult.warnings}
          isImporting={isImporting}
          error={error}
          onBack={() => {
            setStep("upload");
            setError(null);
          }}
          onImport={handleImport}
        />
      )}

      {step === "done" && importResult && (
        <ImportCompleteStep result={importResult} onImportAnother={reset} />
      )}
    </div>
  );
}
