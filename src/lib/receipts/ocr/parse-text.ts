import { extractMerchantFromReceiptText } from "@/lib/receipts/ocr/extract-merchant";
import type { ReceiptPaymentMethod } from "@/types/database";
import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";

const TOTAL_LABELS =
  /(?:^|\n)\s*(?:total(?:\s+due)?|amount\s+due|grand\s+total|balance\s+due|you\s+paid)\s*[:\s]*[£$]?\s*([\d,]+\.?\d*)/im;

const VAT_LABELS =
  /(?:vat|v\.a\.t\.?)\s*(?:@?\s*\d+%?)?\s*[:\s]*[£$]?\s*([\d,]+\.?\d*)/im;

const CURRENCY_AMOUNT = /[£$]\s*([\d,]+\.\d{2})\b/g;

const UK_DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/gi,
  /\b(\d{4})-(\d{2})-(\d{2})\b/g,
];

const PAYMENT_PATTERNS: Array<{
  method: ReceiptPaymentMethod;
  pattern: RegExp;
}> = [
  { method: "contactless", pattern: /\bcontactless\b/i },
  { method: "cash", pattern: /\b(cash|paid\s+in\s+cash)\b/i },
  {
    method: "card",
    pattern: /\b(card|debit|credit|visa|mastercard|amex|chip\s*&\s*pin)\b/i,
  },
];

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

function toIsoDate(day: number, month: number, year: number): string | null {
  const y = year < 100 ? 2000 + year : year;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

function extractDate(text: string): string | null {
  for (const pattern of UK_DATE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match[0].includes("-") && match.length >= 4) {
        const iso = `${match[1]}-${match[2]}-${match[3]}`;
        if (!Number.isNaN(new Date(`${iso}T12:00:00`).getTime())) {
          return iso;
        }
      }
      const monthNames = [
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
      const monthStr = match[2]?.toString().toLowerCase().slice(0, 3);
      const monthIndex = monthNames.indexOf(monthStr ?? "");
      if (monthIndex >= 0) {
        const day = Number(match[1]);
        let year = Number(match[3]);
        if (year < 100) year += 2000;
        const iso = toIsoDate(day, monthIndex + 1, year);
        if (iso) return iso;
      } else {
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
  }
  return null;
}

function extractTotal(text: string): number | null {
  const labelMatch = text.match(TOTAL_LABELS);
  if (labelMatch?.[1]) {
    const parsed = parseAmount(labelMatch[1]);
    if (parsed !== null) return parsed;
  }

  const amounts: number[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(CURRENCY_AMOUNT.source, CURRENCY_AMOUNT.flags);
  while ((match = re.exec(text)) !== null) {
    const parsed = parseAmount(match[1]);
    if (parsed !== null) amounts.push(parsed);
  }

  if (amounts.length === 0) return null;
  return Math.max(...amounts);
}

function extractVat(text: string): number | null {
  const match = text.match(VAT_LABELS);
  if (match?.[1]) {
    return parseAmount(match[1]);
  }
  return null;
}

function extractPaymentMethod(text: string): ReceiptPaymentMethod | null {
  for (const { method, pattern } of PAYMENT_PATTERNS) {
    if (pattern.test(text)) return method;
  }
  return null;
}

function buildConfidence(
  extraction: Omit<ReceiptOcrExtraction, "confidence" | "fieldsFound">
): Pick<ReceiptOcrExtraction, "confidence" | "fieldsFound"> {
  const fieldsFound: string[] = [];
  if (extraction.merchant) fieldsFound.push("merchant");
  if (extraction.receiptDate) fieldsFound.push("date");
  if (extraction.totalAmount !== null) fieldsFound.push("total");
  if (extraction.vatAmount !== null) fieldsFound.push("vat");
  if (extraction.paymentMethod) fieldsFound.push("payment");

  let confidence: ReceiptOcrExtraction["confidence"] = "low";
  if (fieldsFound.length >= 3) confidence = "high";
  else if (fieldsFound.length >= 1) confidence = "medium";

  return { confidence, fieldsFound };
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
      totalAmount: null,
      vatAmount: null,
      paymentMethod: null,
      rawText: null,
      confidence: "low",
      fieldsFound: [],
    };
  }

  const merchantResult = extractMerchantFromReceiptText(normalized);

  const base = {
    merchant: merchantResult.merchant,
    merchantSource: merchantResult.source,
    knownMerchantId: merchantResult.knownMerchantId,
    receiptDate: extractDate(normalized),
    totalAmount: extractTotal(normalized),
    vatAmount: extractVat(normalized),
    paymentMethod: extractPaymentMethod(normalized),
    rawText: normalized.slice(0, 8000),
  };

  const { confidence, fieldsFound } = buildConfidence(base);

  return { ...base, confidence, fieldsFound };
}
