"use client";

import { FileText, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AccountRow } from "@/lib/accounts/queries";

const ACCEPTED_TYPES = ".pdf,.csv,application/pdf,text/csv";

interface ImportUploadStepProps {
  accounts: AccountRow[];
  defaultAccountId: string;
  isParsing: boolean;
  error: string | null;
  onParse: (accountId: string, file: File) => void;
}

function detectClientFileType(file: File): "pdf" | "csv" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".csv") || file.type.includes("csv")) return "csv";
  return null;
}

export function ImportUploadStep({
  accounts,
  defaultAccountId,
  isParsing,
  error,
  onParse,
}: ImportUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const assignFile = useCallback((next: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    const type = detectClientFileType(next);
    if (!type) {
      setLocalError("Only PDF bank statements and CSV files are supported.");
      setFile(null);
      return;
    }
    setLocalError(null);
    setFile(next);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      assignFile(event.dataTransfer.files[0] ?? null);
    },
    [assignFile]
  );

  const handleContinue = () => {
    if (!accountId) {
      setLocalError("Please select an account.");
      return;
    }
    if (!file) {
      setLocalError("Please upload a PDF or CSV file.");
      return;
    }
    onParse(accountId, file);
  };

  const fileType = file ? detectClientFileType(file) : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="import-account">Import into account</Label>
        <Select
          id="import-account"
          value={accountId}
          disabled={isParsing}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/40"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Drop your statement here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF bank statements (Lloyds) or CSV exports
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={isParsing}>
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          disabled={isParsing}
          onChange={(e) => assignFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {file && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {fileType?.toUpperCase()} · {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isParsing}
            onClick={(e) => {
              e.stopPropagation();
              assignFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove
          </Button>
        </div>
      )}

      {(localError || error) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {localError ?? error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="button" disabled={isParsing || !file} onClick={handleContinue}>
          {isParsing ? "Parsing…" : "Continue to preview"}
        </Button>
      </div>
    </div>
  );
}
