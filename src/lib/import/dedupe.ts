import type {
  ImportPreviewRow,
  ImportPreviewStatus,
  NormalizedImportTransaction,
} from "@/lib/import/types";
import type { TransactionDirection } from "@/types/database";

export interface ExistingTransactionFingerprint {
  id: string;
  transaction_date: string;
  amount: number;
  direction: TransactionDirection;
  description: string | null;
  merchant_name: string | null;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTransactionFingerprint(
  accountId: string,
  tx: Pick<
    NormalizedImportTransaction,
    "date" | "amount" | "direction" | "description"
  >
): string {
  return [
    accountId,
    tx.date,
    tx.direction,
    tx.amount.toFixed(2),
    normalizeText(tx.description),
  ].join("|");
}

export function buildExistingFingerprint(
  accountId: string,
  tx: ExistingTransactionFingerprint
): string {
  return buildTransactionFingerprint(accountId, {
    date: tx.transaction_date,
    amount: Number(tx.amount),
    direction: tx.direction,
    description: tx.description ?? tx.merchant_name ?? "",
  });
}

export function markImportPreviewRows(
  transactions: NormalizedImportTransaction[],
  existing: ExistingTransactionFingerprint[],
  accountId: string
): ImportPreviewRow[] {
  const existingFingerprints = new Map<string, string>();

  for (const tx of existing) {
    const key = buildExistingFingerprint(accountId, tx);
    if (!existingFingerprints.has(key)) {
      existingFingerprints.set(key, tx.id);
    }
  }

  const seenImportKeys = new Set<string>();
  const rows: ImportPreviewRow[] = [];

  transactions.forEach((tx, index) => {
    let status: ImportPreviewStatus = "new";
    let existingTransactionId: string | undefined;

    if (seenImportKeys.has(tx.import_key)) {
      status = "duplicate_in_file";
    } else {
      seenImportKeys.add(tx.import_key);
      const fingerprint = buildTransactionFingerprint(accountId, tx);
      const matchId = existingFingerprints.get(fingerprint);
      if (matchId) {
        status = "duplicate";
        existingTransactionId = matchId;
      }
    }

    rows.push({
      ...tx,
      preview_id: `preview-${index}`,
      status,
      existing_transaction_id: existingTransactionId,
    });
  });

  return rows;
}

export function filterRowsForImport(rows: ImportPreviewRow[]): ImportPreviewRow[] {
  return rows.filter((row) => row.status === "new");
}
