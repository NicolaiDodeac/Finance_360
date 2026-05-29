import { extractMerchantFromReceiptText } from "@/lib/receipts/ocr/extract-merchant";
import { parseMoneyAmount } from "@/lib/receipts/ocr/parse-amount";
import {
  resolveReviewLevel,
  scoreFieldConfidence,
} from "@/lib/receipts/ocr/confidence";
import type { ReceiptPaymentMethod } from "@/types/database";
import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";

/**
 * Final-total label lines, in priority order. Subtotal/savings are handled
 * separately so we never mistake them for the amount actually paid.
 */
const TOTAL_LABELS: RegExp[] = [
  /(?:^|\n)\s*(?:grand\s+total|total\s+to\s+pay|amount\s+due|balance\s+due|you\s+paid|total\s+paid)\s*[:\s]*[£$€]?\s*([\d.,]+)/im,
  /(?:^|\n)\s*total\s*[:\s]*[£$€]?\s*([\d.,]+)/im,
  /(?:^|\n)\s*(?:card|contactless|paid|sale|purchase|debit|credit)\s*[:\s]*[£$€]?\s*([\d.,]+)/im,
];

/** Lines whose amounts must never be treated as the receipt total. */
const TOTAL_EXCLUSION =
  /\b(vat|v\.a\.t\.?|tax|change|cash\s*back|cashback|tendered|tender|round(?:ing)?|points?|balance\s+remaining|savings?)\b/i;

const VAT_LABELS =
  /(?:vat|v\.a\.t\.?|gb\s*vat|vat\s*reg)\s*(?:no\.?|number|reg\.?)?\s*(?:@?\s*\d+%?)?\s*[:\s]*[£$€]?\s*([\d.,]+)/im;

const CURRENCY_AMOUNT =
  /[£$€]\s*([\d,]+[.,]\d{1,2})\b|[£$€]\s*([\d,]+\.\d{2})\b|(?:^|\s)([\d,]+[.,]\d{1,2})(?:\s|$)/g;

const UK_DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/gi,
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{2,4})\b/gi,
  /\b(\d{4})-(\d{2})-(\d{2})\b/g,
];

const PAYMENT_PATTERNS: Array<{
  method: ReceiptPaymentMethod;
  pattern: RegExp;
}> = [
  { method: "contactless", pattern: /\b(contactless|tap\s*(?:to\s*pay)?|apple\s*pay|google\s*pay)\b/i },
  { method: "cash", pattern: /\b(cash|paid\s+in\s+cash|cash\s+tendered)\b/i },
  {
    method: "card",
    pattern:
      /\b(card|debit|credit|visa|mastercard|maestro|amex|american\s+express|chip\s*&?\s*pin|chip\s+and\s+pin)\b/i,
  },
];

function toIsoDate(day: number, month: number, year: number): string | null {
  const y = year < 100 ? 2000 + year : year;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

function extractDate(text: string): string | null {
  const withTime =
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\s+\d{1,2}:\d{2}/.exec(text);
  if (withTime) {
    let d = Number(withTime[1]);
    let m = Number(withTime[2]);
    let y = Number(withTime[3]);
    if (y < 100) y += 2000;
    if (m > 12 && d <= 12) [d, m] = [m, d];
    const iso = toIsoDate(d, m, y);
    if (iso) return iso;
  }

  for (const pattern of UK_DATE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match[0].includes("-") && /^\d{4}-\d{2}-\d{2}$/.test(match[0])) {
        const iso = `${match[1]}-${match[2]}-${match[3]}`;
        if (!Number.isNaN(new Date(`${iso}T12:00:00`).getTime())) {
          return iso;
        }
        continue;
      }

      // "12 May 2026" — month name in slot 2.
      const monthInTwo = MONTH_NAMES.indexOf(
        match[2]?.toString().toLowerCase().slice(0, 3) ?? ""
      );
      if (monthInTwo >= 0) {
        const day = Number(match[1]);
        let year = Number(match[3]);
        if (year < 100) year += 2000;
        const iso = toIsoDate(day, monthInTwo + 1, year);
        if (iso) return iso;
        continue;
      }

      // "May 12, 2026" — month name in slot 1.
      const monthInOne = MONTH_NAMES.indexOf(
        match[1]?.toString().toLowerCase().slice(0, 3) ?? ""
      );
      if (monthInOne >= 0) {
        const day = Number(match[2]);
        let year = Number(match[3]);
        if (year < 100) year += 2000;
        const iso = toIsoDate(day, monthInOne + 1, year);
        if (iso) return iso;
        continue;
      }

      // Numeric d/m/y (UK-first, with disambiguation).
      let d = Number(match[1]);
      let m = Number(match[2]);
      let y = Number(match[3]);
      if (y < 100) y += 2000;
      if (m > 12 && d <= 12) {
        [d, m] = [m, d];
      }
      const iso = toIsoDate(d, m, y);
      if (iso) return iso;
    }
  }
  return null;
}

interface TotalResult {
  amount: number | null;
  source: "keyword" | "largest" | "none";
}

function extractTotal(text: string): TotalResult {
  // 1. Keyword lines (most reliable), skipping VAT/change/cashback lines.
  const lines = text.split(/\n/);
  for (const pattern of TOTAL_LABELS) {
    for (const line of lines) {
      if (TOTAL_EXCLUSION.test(line)) continue;
      pattern.lastIndex = 0;
      const labelMatch = pattern.exec(`\n${line}`);
      if (labelMatch?.[1]) {
        const parsed = parseMoneyAmount(labelMatch[1]);
        if (parsed !== null && parsed > 0) {
          return { amount: parsed, source: "keyword" };
        }
      }
    }
  }

  // 2. Largest plausible amount, biased to amounts at/below any subtotal,
  //    ignoring VAT/change/cashback lines.
  const amounts: number[] = [];
  for (const line of lines) {
    if (TOTAL_EXCLUSION.test(line)) continue;
    const re = new RegExp(CURRENCY_AMOUNT.source, CURRENCY_AMOUNT.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      const raw = match[1] ?? match[2] ?? match[3];
      if (!raw) continue;
      const parsed = parseMoneyAmount(raw);
      if (parsed !== null && parsed > 0) amounts.push(parsed);
    }
  }

  if (amounts.length === 0) return { amount: null, source: "none" };

  const subtotalMatch = /subtotal\s*[:\s]*[£$€]?\s*([\d.,]+)/i.exec(text);
  if (subtotalMatch?.[1]) {
    const subtotal = parseMoneyAmount(subtotalMatch[1]);
    const belowSubtotal = amounts.filter(
      (a) => subtotal === null || a <= subtotal
    );
    if (belowSubtotal.length > 0) {
      return { amount: Math.max(...belowSubtotal), source: "largest" };
    }
  }

  return { amount: Math.max(...amounts), source: "largest" };
}

function extractVat(text: string): number | null {
  const match = text.match(VAT_LABELS);
  if (match?.[1]) {
    return parseMoneyAmount(match[1]);
  }
  return null;
}

function extractPaymentMethod(text: string): ReceiptPaymentMethod | null {
  for (const { method, pattern } of PAYMENT_PATTERNS) {
    if (pattern.test(text)) return method;
  }
  return null;
}

function legacyFieldList(extraction: {
  merchant: string | null;
  receiptDate: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  paymentMethod: ReceiptPaymentMethod | null;
}): string[] {
  const fieldsFound: string[] = [];
  if (extraction.merchant) fieldsFound.push("merchant");
  if (extraction.receiptDate) fieldsFound.push("date");
  if (extraction.totalAmount !== null) fieldsFound.push("total");
  if (extraction.vatAmount !== null) fieldsFound.push("vat");
  if (extraction.paymentMethod) fieldsFound.push("payment");
  return fieldsFound;
}

/** Parse plain text from a receipt PDF or OCR output. */
export function parseReceiptText(text: string): ReceiptOcrExtraction {
  const normalized = text.replace(/\r/g, "\n").trim();
  if (!normalized) {
    return {
      merchant: null,
      merchantSource: "unknown",
      knownMerchantId: null,
      receiptDate: null,
      dateIsFallback: false,
      totalAmount: null,
      vatAmount: null,
      paymentMethod: null,
      rawText: null,
      confidence: "low",
      fieldsFound: [],
      fieldConfidence: {
        merchant: "low",
        date: "low",
        total: "low",
        payment: "low",
        vat: "low",
      },
      reviewLevel: "needs_review",
    };
  }

  const merchantResult = extractMerchantFromReceiptText(normalized);
  const totalResult = extractTotal(normalized);
  const receiptDate = extractDate(normalized);
  const vatAmount = extractVat(normalized);
  const paymentMethod = extractPaymentMethod(normalized);

  const base = {
    merchant: merchantResult.merchant,
    merchantSource: merchantResult.source,
    knownMerchantId: merchantResult.knownMerchantId,
    receiptDate,
    dateIsFallback: false,
    totalAmount: totalResult.amount,
    vatAmount,
    paymentMethod,
    rawText: normalized.slice(0, 8000),
  };

  const fieldConfidence = scoreFieldConfidence({
    merchant: base.merchant,
    merchantSource: base.merchantSource,
    receiptDate: base.receiptDate,
    dateIsFallback: base.dateIsFallback,
    totalAmount: base.totalAmount,
    totalSource: totalResult.source,
    paymentMethod: base.paymentMethod,
    vatAmount: base.vatAmount,
  });

  const reviewLevel = resolveReviewLevel(fieldConfidence, {
    merchant: base.merchant,
    receiptDate: base.receiptDate,
    totalAmount: base.totalAmount,
    dateIsFallback: base.dateIsFallback,
  });

  const confidence =
    reviewLevel === "high"
      ? "high"
      : reviewLevel === "medium"
        ? "medium"
        : "low";

  return {
    ...base,
    fieldsFound: legacyFieldList(base),
    fieldConfidence,
    reviewLevel,
    confidence,
  };
}
