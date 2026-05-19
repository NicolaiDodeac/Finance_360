import type { ImportAdapter, ImportParseResult } from "@/lib/import/adapters/types";
import { isLloydsStatementText } from "@/lib/import/detect";
import { extractPdfText } from "@/lib/import/pdf/extract-text";
import type { NormalizedImportTransaction } from "@/lib/import/types";
import type { TransactionDirection } from "@/types/database";

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const TRANSACTION_BLOCK_REGEX =
  /Date\s*\n\s*([^\n]+?)\s*\n\s*Description\s*\n\s*([^\n]+?)\s*\n\s*Type\s*\n\s*([^\n]+?)\s*\n[\s\S]*?Money In \(£\)\s*\n\s*([^\n]+?)\s*\n[\s\S]*?Money Out \(£\)\s*\n\s*([^\n]+?)\s*\n[\s\S]*?Balance \(£\)\s*\n\s*([^\n]+?)(?=\s*\nDate\s*\n|\s*\nTransaction types\.|\s*--\s*\d+\s+of\s+\d+\s+--|$)/gi;

function normalizePdfText(text: string): string {
  return text.replace(/\t/g, " ").replace(/\r\n/g, "\n");
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/\.$/, "").toLowerCase();
  if (!cleaned || cleaned === "blank" || cleaned === "blank.") {
    return null;
  }
  const value = Number.parseFloat(cleaned.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function parseLloydsDateToken(
  token: string,
  fallbackYear: number
): string | null {
  const cleaned = token.trim().replace(/\.$/, "");
  const match = cleaned.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const month = MONTHS[match[2].toLowerCase()];
  if (month === undefined) {
    return null;
  }

  let year = Number.parseInt(match[3], 10);
  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }
  if (year < 1000) {
    year = fallbackYear;
  }

  const date = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function extractStatementEndYear(text: string): number {
  const periodMatch = text.match(
    /(\d{1,2}\s+[A-Za-z]{3}\s+)(\d{4})\s+to\s+(\d{1,2}\s+[A-Za-z]{3}\s+)(\d{4})/i
  );
  if (periodMatch) {
    return Number.parseInt(periodMatch[4], 10);
  }

  const statementDate = text.match(
    /(\d{1,2}\s+[A-Za-z]{3}\s+)(\d{4})\s*\nIf you think something is incorrect/i
  );
  if (statementDate) {
    return Number.parseInt(statementDate[2], 10);
  }

  return new Date().getFullYear();
}

function inferDirection(
  moneyIn: number | null,
  moneyOut: number | null,
  typeCode: string
): TransactionDirection | null {
  if (moneyIn !== null && moneyIn > 0 && (moneyOut === null || moneyOut === 0)) {
    return "income";
  }
  if (moneyOut !== null && moneyOut > 0 && (moneyIn === null || moneyIn === 0)) {
    return "expense";
  }

  if (moneyIn !== null && moneyOut !== null && moneyIn > 0 && moneyOut > 0) {
    return moneyIn >= moneyOut ? "income" : "expense";
  }

  const transferTypes = new Set(["TFR", "FPI", "FPO", "MPI", "MPO"]);
  if (transferTypes.has(typeCode.toUpperCase())) {
    if (moneyIn !== null && moneyIn > 0) return "income";
    if (moneyOut !== null && moneyOut > 0) return "expense";
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

export function parseLloydsStatementText(
  text: string
): ImportParseResult {
  const warnings: string[] = [];
  const normalized = normalizePdfText(text);
  const fallbackYear = extractStatementEndYear(normalized);
  const transactions: NormalizedImportTransaction[] = [];
  const seenKeys = new Set<string>();

  TRANSACTION_BLOCK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TRANSACTION_BLOCK_REGEX.exec(normalized)) !== null) {
    const [, dateRaw, descriptionRaw, typeRaw, moneyInRaw, moneyOutRaw, balanceRaw] =
      match;

    const date = parseLloydsDateToken(dateRaw, fallbackYear);
    if (!date) {
      warnings.push(`Skipped row with unparseable date: "${dateRaw.trim()}"`);
      continue;
    }

    const description = descriptionRaw.trim().replace(/\.$/, "");
    const typeCode = typeRaw.trim().replace(/\.$/, "");
    const moneyIn = parseAmount(moneyInRaw);
    const moneyOut = parseAmount(moneyOutRaw);
    const balance = parseAmount(balanceRaw);

    const direction = inferDirection(moneyIn, moneyOut, typeCode);
    if (!direction) {
      warnings.push(`Skipped "${description}" — could not determine direction.`);
      continue;
    }

    const amount =
      direction === "income"
        ? (moneyIn ?? 0)
        : (moneyOut ?? moneyIn ?? 0);

    if (amount <= 0) {
      warnings.push(`Skipped "${description}" — zero amount.`);
      continue;
    }

    const importKey = buildImportKey(date, amount, description, direction);
    if (seenKeys.has(importKey)) {
      warnings.push(`Duplicate in file skipped: ${description} on ${date}.`);
      continue;
    }
    seenKeys.add(importKey);

    transactions.push({
      date,
      description,
      merchant_name: description,
      amount,
      direction,
      balance,
      import_key: importKey,
      raw_import_data: {
        source: "lloyds-pdf",
        type: typeCode,
        money_in: moneyIn,
        money_out: moneyOut,
        balance,
        date_raw: dateRaw.trim(),
      },
    });
  }

  if (transactions.length === 0) {
    warnings.push(
      "No transactions found. Ensure this is a Lloyds PDF statement with the standard layout."
    );
  }

  return { transactions, warnings };
}

export const lloydsPdfAdapter: ImportAdapter = {
  id: "lloyds-pdf",
  label: "Lloyds Bank (PDF statement)",
  fileTypes: ["pdf"],
  canParse(context) {
    if (context.fileType !== "pdf") return false;
    if (context.text) return isLloydsStatementText(context.text);
    return /\.pdf$/i.test(context.fileName);
  },
  async parse(context) {
    const text =
      context.text ?? (await extractPdfText(context.buffer));
    if (!isLloydsStatementText(text)) {
      return {
        transactions: [],
        warnings: [
          "This PDF does not look like a Lloyds Bank statement. Only Lloyds PDFs are supported for now.",
        ],
      };
    }
    return parseLloydsStatementText(text);
  },
};
