import { extractPdfText } from "@/lib/import/pdf/extract-text";
import { prepareImageBufferForOcr } from "@/lib/receipts/ocr/prepare-image";
import { preprocessImageForOcr } from "@/lib/receipts/ocr/preprocess-image";
import { parseReceiptText } from "@/lib/receipts/ocr/parse-text";
import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";
import { EMPTY_RECEIPT_EXTRACTION } from "@/lib/receipts/ocr/types";

const OCR_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

async function extractImageText(
  buffer: Buffer,
  mimeType: string | null
): Promise<{ text: string; error?: string }> {
  const prepared = await prepareImageBufferForOcr(buffer, mimeType);
  if (prepared.error && !OCR_IMAGE_MIMES.has(prepared.mimeType)) {
    return { text: "", error: prepared.error };
  }
  if (prepared.error) {
    return { text: "", error: prepared.error };
  }

  // OCR-only enhancement. Original stored file is never modified.
  const enhanced = await preprocessImageForOcr(
    prepared.buffer,
    prepared.mimeType
  );

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const result = await worker.recognize(enhanced.buffer);
      const text = result.data.text?.trim() ?? "";
      if (!text) {
        return {
          text: "",
          error:
            "Could not read text from the photo. Try a flatter photo with the full receipt in frame.",
        };
      }
      return { text };
    } finally {
      await worker.terminate();
    }
  } catch {
    return {
      text: "",
      error:
        "We couldn't read this photo. Add the details manually or try another photo.",
    };
  }
}

/** Run OCR / text extraction on a receipt file buffer. */
export async function extractReceiptFromBuffer(
  buffer: Buffer,
  mimeType: string | null
): Promise<ReceiptOcrExtraction & { ocrError?: string }> {
  const mime = (mimeType ?? "").toLowerCase();

  if (mime === "application/pdf" || mime.includes("pdf")) {
    try {
      const text = await extractPdfText(buffer);
      if (text.trim()) {
        return parseReceiptText(text);
      }
    } catch {
      return { ...EMPTY_RECEIPT_EXTRACTION, ocrError: "Could not read PDF." };
    }
    return {
      ...EMPTY_RECEIPT_EXTRACTION,
      ocrError: "No text found in PDF.",
    };
  }

  const isImage =
    OCR_IMAGE_MIMES.has(mime) ||
    mime.startsWith("image/");

  if (isImage) {
    const { text, error } = await extractImageText(buffer, mime);
    if (text.trim()) {
      return parseReceiptText(text);
    }
    return { ...EMPTY_RECEIPT_EXTRACTION, ocrError: error ?? "No text read from image." };
  }

  return {
    ...EMPTY_RECEIPT_EXTRACTION,
    ocrError: "Unsupported file type for scanning.",
  };
}

export function extractionToOcrData(
  extraction: ReceiptOcrExtraction
): Record<string, unknown> {
  return {
    merchant: extraction.merchant,
    merchant_source: extraction.merchantSource,
    known_merchant_id: extraction.knownMerchantId,
    receipt_date: extraction.receiptDate,
    date_is_fallback: extraction.dateIsFallback ?? false,
    total_amount: extraction.totalAmount,
    vat_amount: extraction.vatAmount,
    payment_method: extraction.paymentMethod,
    confidence: extraction.confidence,
    fields_found: extraction.fieldsFound,
    field_confidence: extraction.fieldConfidence,
    review_level: extraction.reviewLevel,
    raw_text: extraction.rawText
      ? extraction.rawText.slice(0, 4000)
      : null,
    extracted_at: new Date().toISOString(),
  };
}
