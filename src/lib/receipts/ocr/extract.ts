import { extractPdfText } from "@/lib/import/pdf/extract-text";
import { parseReceiptText } from "@/lib/receipts/ocr/parse-text";
import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";
import { EMPTY_RECEIPT_EXTRACTION } from "@/lib/receipts/ocr/types";

const IMAGE_MIME_PREFIXES = ["image/jpeg", "image/png", "image/jpg"];

async function extractImageText(buffer: Buffer): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const result = await worker.recognize(buffer);
      return result.data.text ?? "";
    } finally {
      await worker.terminate();
    }
  } catch {
    return "";
  }
}

/** Run OCR / text extraction on a receipt file buffer. */
export async function extractReceiptFromBuffer(
  buffer: Buffer,
  mimeType: string | null
): Promise<ReceiptOcrExtraction> {
  const mime = (mimeType ?? "").toLowerCase();

  if (mime === "application/pdf" || mime.includes("pdf")) {
    try {
      const text = await extractPdfText(buffer);
      if (text.trim()) {
        return parseReceiptText(text);
      }
    } catch {
      return EMPTY_RECEIPT_EXTRACTION;
    }
    return EMPTY_RECEIPT_EXTRACTION;
  }

  if (
    IMAGE_MIME_PREFIXES.some((p) => mime.startsWith(p)) ||
    mime.startsWith("image/")
  ) {
    const text = await extractImageText(buffer);
    if (text.trim()) {
      return parseReceiptText(text);
    }
    return EMPTY_RECEIPT_EXTRACTION;
  }

  return EMPTY_RECEIPT_EXTRACTION;
}

export function extractionToOcrData(
  extraction: ReceiptOcrExtraction
): Record<string, unknown> {
  return {
    merchant: extraction.merchant,
    receipt_date: extraction.receiptDate,
    total_amount: extraction.totalAmount,
    vat_amount: extraction.vatAmount,
    payment_method: extraction.paymentMethod,
    confidence: extraction.confidence,
    fields_found: extraction.fieldsFound,
    raw_text: extraction.rawText
      ? extraction.rawText.slice(0, 4000)
      : null,
    extracted_at: new Date().toISOString(),
  };
}
