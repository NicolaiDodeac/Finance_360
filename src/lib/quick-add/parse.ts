import { matchHints, stripForMerchant } from "@/lib/quick-add/hints";
import type { QuickAddParsedSegment } from "@/lib/quick-add/types";
import { businessExpenseChoiceFromCategorySlug } from "@/lib/categorization/categorise-flow/prefill";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";

const AMOUNT_REGEX =
  /(?:[£$€]\s*)(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*[£$€]|(?<!\d\.)(\d+(?:\.\d{1,2})?)(?!\d)/i;

function extractAmount(segment: string): number | null {
  const match = segment.match(AMOUNT_REGEX);
  if (!match) return null;
  const raw = match[1] ?? match[2] ?? match[3];
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function splitSegments(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const parts = trimmed
    .split(/,(?=\s*[^,]*(?:[£$€]|\d))/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [trimmed];
}

function inferCategoryFromMerchant(
  merchant: string,
  purpose: "personal" | "business"
): CategoryChoiceId | null {
  const lower = merchant.toLowerCase();
  for (const [choiceId, spec] of Object.entries(CHOICE_SPECS) as Array<
    [CategoryChoiceId, (typeof CHOICE_SPECS)[CategoryChoiceId]]
  >) {
    if (!spec.keywords?.length) continue;
    if (spec.isBusiness && purpose !== "business") continue;
    if (!spec.isBusiness && purpose === "business" && choiceId.startsWith("other_business")) {
      continue;
    }
    if (
      spec.keywords.some((kw) => lower.includes(kw.toLowerCase())) &&
      (purpose === "business" ? spec.isBusiness : !spec.isBusiness || choiceId === "groceries")
    ) {
      if (purpose === "personal" && spec.isBusiness) continue;
      return choiceId;
    }
  }
  return null;
}

function assessConfidence(
  merchant: string,
  amount: number | null,
  categoryChoiceId: CategoryChoiceId | null,
  purpose: "personal" | "business" | "not_sure"
): { confidence: QuickAddParsedSegment["confidence"]; reviewRecommended: boolean } {
  if (!merchant || merchant.length < 2 || amount === null) {
    return { confidence: "review_recommended", reviewRecommended: true };
  }

  if (purpose === "business" && categoryChoiceId) {
    const spec = CHOICE_SPECS[categoryChoiceId];
    if (spec.isBusiness && spec.hmrcCode) {
      return { confidence: "high", reviewRecommended: false };
    }
    if (spec.isBusiness && !spec.hmrcCode) {
      return { confidence: "review_recommended", reviewRecommended: true };
    }
  }

  if (!categoryChoiceId) {
    return { confidence: "review_recommended", reviewRecommended: true };
  }

  return { confidence: "high", reviewRecommended: false };
}

function parseOneSegment(segment: string): QuickAddParsedSegment {
  const hints = matchHints(segment);
  const amount = extractAmount(segment);
  const merchantName = stripForMerchant(segment);

  const purpose = hints.purpose ?? "personal";
  let categoryChoiceId = hints.categoryChoiceId;

  if (!categoryChoiceId && merchantName) {
    categoryChoiceId = inferCategoryFromMerchant(
      merchantName,
      purpose === "business" ? "business" : "personal"
    );
  }

  if (purpose === "business" && categoryChoiceId) {
    const spec = CHOICE_SPECS[categoryChoiceId];
    if (!spec.isBusiness && spec.categorySlug) {
      const biz = businessExpenseChoiceFromCategorySlug(spec.categorySlug);
      categoryChoiceId = biz ?? "other_business_expense";
    }
  }

  const { confidence, reviewRecommended } = assessConfidence(
    merchantName,
    amount,
    categoryChoiceId,
    purpose
  );

  return {
    originalSegment: segment,
    merchantName: merchantName || segment.trim(),
    amount,
    direction: hints.direction ?? "expense",
    purpose,
    categoryChoiceId,
    flowTypeOverride: hints.flowTypeOverride,
    confidence,
    reviewRecommended,
  };
}

/** Parse natural-language quick-add input into one or more draft segments. */
export function parseQuickAddText(text: string): QuickAddParsedSegment[] {
  const segments = splitSegments(text);
  if (segments.length === 0) return [];

  return segments.map(parseOneSegment);
}
