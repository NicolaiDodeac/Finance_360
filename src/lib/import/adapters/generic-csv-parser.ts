import type { ImportAdapter, ImportParseResult } from "@/lib/import/adapters/types";
import type { NormalizedImportTransaction } from "@/lib/import/types";
import type { TransactionDirection } from "@/types/database";

type CsvRow = Record<string, string>;

const DATE_HEADERS = ["date", "transaction date", "posted date", "value date"];
const DESCRIPTION_HEADERS = [
  "description",
  "details",
  "narrative",
  "memo",
  "payee",
];
const AMOUNT_HEADERS = ["amount", "value"];
const DEBIT_HEADERS = ["debit", "money out", "paid out", "withdrawal"];
const CREDIT_HEADERS = ["credit", "money in", "paid in", "deposit"];
const BALANCE_HEADERS = ["balance", "running balance"];

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
      if (char === "\r") i += 1;
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate);
    if (index >= 0) return index;
  }
  for (let i = 0; i < normalized.length; i += 1) {
    if (candidates.some((c) => normalized[i].includes(c))) {
      return i;
    }
  }
  return -1;
}

function rowsToObjects(rows: string[][]): CsvRow[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => normalizeHeader(h));
  return rows.slice(1).map((cells) => {
    const obj: CsvRow = {};
    headers.forEach((header, index) => {
      obj[header] = (cells[index] ?? "").trim();
    });
    return obj;
  });
}

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[£,\s]/g, "").replace(/[()]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "—") return null;
  const negative = cleaned.startsWith("-");
  const value = Number.parseFloat(negative ? cleaned.slice(1) : cleaned);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

function parseCsvDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    let year = Number.parseInt(dmy[3], 10);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    return `${year}-${month}-${day}`;
  }

  const dmyText = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (dmyText) {
    const months: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const month = months[dmyText[2].toLowerCase()];
    if (!month) return null;
    let year = Number.parseInt(dmyText[3], 10);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    return `${year}-${month}-${dmyText[1].padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function buildImportKey(
  date: string,
  amount: number,
  description: string,
  direction: TransactionDirection
): string {
  return `${date}|${direction}|${amount.toFixed(2)}|${description.toLowerCase().trim()}`;
}

export function parseGenericCsvContent(content: string): ImportParseResult {
  const warnings: string[] = [];
  const rows = parseCsv(content);
  const objects = rowsToObjects(rows);

  if (objects.length === 0) {
    return {
      transactions: [],
      warnings: ["CSV file is empty or has no data rows."],
    };
  }

  const headers = rows[0].map(normalizeHeader);
  const dateIdx = findHeaderIndex(headers, DATE_HEADERS);
  const descIdx = findHeaderIndex(headers, DESCRIPTION_HEADERS);
  const amountIdx = findHeaderIndex(headers, AMOUNT_HEADERS);
  const debitIdx = findHeaderIndex(headers, DEBIT_HEADERS);
  const creditIdx = findHeaderIndex(headers, CREDIT_HEADERS);
  const balanceIdx = findHeaderIndex(headers, BALANCE_HEADERS);

  if (dateIdx < 0) {
    return {
      transactions: [],
      warnings: ["Could not find a date column in the CSV."],
    };
  }

  const transactions: NormalizedImportTransaction[] = [];
  const seenKeys = new Set<string>();

  for (const [rowIndex, row] of objects.entries()) {
    const cells = rows[rowIndex + 1] ?? [];
    const dateRaw = cells[dateIdx] ?? row[headers[dateIdx]] ?? "";
    const date = parseCsvDate(dateRaw);
    if (!date) {
      warnings.push(`Row ${rowIndex + 2}: unparseable date "${dateRaw}".`);
      continue;
    }

    const description =
      (descIdx >= 0 ? cells[descIdx] : "") ||
      row[headers[descIdx]] ||
      "Imported transaction";

    let direction: TransactionDirection | null = null;
    let amount: number | null = null;

    if (amountIdx >= 0) {
      const rawAmount = parseAmount(cells[amountIdx] ?? row[headers[amountIdx]]);
      if (rawAmount !== null) {
        amount = Math.abs(rawAmount);
        direction = rawAmount < 0 ? "expense" : "income";
      }
    } else if (debitIdx >= 0 || creditIdx >= 0) {
      const debit = debitIdx >= 0 ? parseAmount(cells[debitIdx]) : null;
      const credit = creditIdx >= 0 ? parseAmount(cells[creditIdx]) : null;
      if (credit !== null && credit > 0) {
        amount = Math.abs(credit);
        direction = "income";
      } else if (debit !== null && debit > 0) {
        amount = Math.abs(debit);
        direction = "expense";
      } else if (debit !== null && debit < 0) {
        amount = Math.abs(debit);
        direction = "expense";
      } else if (credit !== null && credit < 0) {
        amount = Math.abs(credit);
        direction = "income";
      }
    }

    if (!direction || amount === null || amount <= 0) {
      warnings.push(`Row ${rowIndex + 2}: could not determine amount/direction.`);
      continue;
    }

    const balance =
      balanceIdx >= 0
        ? parseAmount(cells[balanceIdx] ?? row[headers[balanceIdx]] ?? "")
        : null;

    const importKey = buildImportKey(date, amount, description, direction);
    if (seenKeys.has(importKey)) {
      warnings.push(`Row ${rowIndex + 2}: duplicate in file skipped.`);
      continue;
    }
    seenKeys.add(importKey);

    transactions.push({
      date,
      description,
      merchant_name: description,
      amount,
      direction,
      balance: balance !== null ? Math.abs(balance) : null,
      import_key: importKey,
      raw_import_data: {
        source: "generic-csv",
        row: rowIndex + 2,
        raw: row,
      },
    });
  }

  return { transactions, warnings };
}

export const genericCsvAdapter: ImportAdapter = {
  id: "generic-csv",
  label: "Generic CSV",
  fileTypes: ["csv"],
  canParse(context) {
    return context.fileType === "csv";
  },
  async parse(context) {
    const content = context.buffer.toString("utf-8");
    return parseGenericCsvContent(content);
  },
};
