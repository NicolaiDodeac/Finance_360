import {
  KNOWN_MERCHANTS,
  type KnownMerchantDef,
} from "@/lib/receipts/ocr/known-merchants";

export type MerchantExtractSource = "known" | "top_line" | "heuristic" | "unknown";

export interface MerchantExtractionResult {
  merchant: string | null;
  source: MerchantExtractSource;
  knownMerchantId: string | null;
}

const MERCHANT_SKIP =
  /^(receipt|invoice|tax|vat|total|subtotal|thank|welcome|tel|phone|www\.|http|date|time|qty|item|change|balance|card|visa|mastercard)/i;

/** Compact form for substring / fuzzy key matching. */
export function compactOcrText(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function matchesKnownMerchant(
  text: string,
  compact: string,
  def: KnownMerchantDef
): boolean {
  for (const pattern of def.patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  for (const key of def.compactKeys) {
    if (compact.includes(key)) return true;
  }
  return false;
}

/** A. Scan full OCR text for known merchants (with fuzzy patterns). */
export function detectKnownMerchant(text: string): {
  displayName: string;
  id: string;
} | null {
  const compact = compactOcrText(text);

  for (const def of KNOWN_MERCHANTS) {
    if (matchesKnownMerchant(text, compact, def)) {
      return { displayName: def.displayName, id: def.id };
    }
  }

  return null;
}

function vowelRatio(letters: string): number {
  if (!letters.length) return 0;
  const vowels = (letters.match(/[aeiouAEIOU]/g) ?? []).length;
  return vowels / letters.length;
}

function looksLikeOcrGarbage(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return true;

  const words = trimmed.split(/\s+/);
  if (words.length >= 5) {
    const singleCharWords = words.filter((w) => w.length === 1).length;
    if (singleCharWords / words.length > 0.45) return true;
  }

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return true;

  const ratio = vowelRatio(letters);
  if (letters.length >= 10 && ratio < 0.12) return true;
  if (letters.length >= 6 && ratio < 0.08) return true;

  const upper = trimmed.toUpperCase();
  const consonantClusters = upper.match(/[B-DF-HJ-NP-TV-Z]{5,}/g);
  if (consonantClusters && consonantClusters.length >= 2) return true;

  return false;
}

function scoreTopLineCandidate(line: string): number {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 60) return -1;
  if (MERCHANT_SKIP.test(trimmed)) return -1;
  if (/^[\d£$.,\s%\-–—]+$/.test(trimmed)) return -1;
  if (looksLikeOcrGarbage(trimmed)) return -1;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return -1;

  let score = 10;
  score += Math.min(letters.length, 20);
  score += vowelRatio(letters) * 30;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 1 && words.length <= 4) score += 15;
  if (words.length > 6) score -= 20;

  if (/[&']/.test(trimmed)) score += 5;
  if (/^[A-Z][A-Za-z0-9&'\s\-]{2,}$/.test(trimmed)) score += 8;

  return score;
}

/** B. Best readable store-name line near the top (rejects OCR noise). */
export function extractTopLineMerchant(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2 && l.length <= 80);

  let best: { line: string; score: number } | null = null;

  for (const line of lines.slice(0, 15)) {
    const score = scoreTopLineCandidate(line);
    if (score < 0) continue;
    if (!best || score > best.score) {
      best = { line, score };
    }
  }

  return best?.line ?? null;
}

/** C. Previous generic heuristic — first plausible line. */
export function extractMerchantHeuristic(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2 && l.length <= 80);

  for (const line of lines.slice(0, 12)) {
    if (MERCHANT_SKIP.test(line)) continue;
    if (/^[\d£$.,\s%-]+$/.test(line)) continue;
    if (looksLikeOcrGarbage(line)) continue;
    if (line.length >= 3) return line;
  }
  return null;
}

/**
 * Merchant extraction priority:
 * A. known merchant anywhere in text
 * B. strong top-line candidate
 * C. generic heuristic
 * D. unknown
 */
export function extractMerchantFromReceiptText(
  text: string
): MerchantExtractionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { merchant: null, source: "unknown", knownMerchantId: null };
  }

  const known = detectKnownMerchant(trimmed);
  if (known) {
    return {
      merchant: known.displayName,
      source: "known",
      knownMerchantId: known.id,
    };
  }

  const topLine = extractTopLineMerchant(trimmed);
  if (topLine) {
    return {
      merchant: topLine,
      source: "top_line",
      knownMerchantId: null,
    };
  }

  const heuristic = extractMerchantHeuristic(trimmed);
  if (heuristic) {
    return {
      merchant: heuristic,
      source: "heuristic",
      knownMerchantId: null,
    };
  }

  return { merchant: null, source: "unknown", knownMerchantId: null };
}
