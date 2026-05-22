import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { FinanceMode } from "@/types/database";
import { showsBusinessFeatures } from "@/lib/profile/types";

export type ReceiptPurpose = "personal" | "business" | "not_sure";

export interface ReceiptTextClassification {
  /** Best-matching business category choice from receipt text. */
  businessChoiceId: CategoryChoiceId | null;
  /** Personal expense choice when purpose is personal. */
  personalChoiceId: CategoryChoiceId | null;
  /** Short label for the suggested creation card, e.g. "Business fuel expense". */
  summaryTitle: string | null;
  /** Pattern id for debugging. */
  patternId: string | null;
  /** Strong receipt evidence for business expenses. */
  evidenceHint: string | null;
  /** Text looked business-relevant (fuel, salon supplies, etc.). */
  looksBusinessRelevant: boolean;
  /** Possible income — never auto-apply; user must confirm. */
  mayBeIncome: boolean;
}

interface ReceiptPatternRule {
  id: string;
  pattern: RegExp;
  businessChoiceId: CategoryChoiceId;
  personalChoiceId?: CategoryChoiceId;
  summaryTitle: string;
  evidenceHint: string;
}

const RECEIPT_PATTERNS: ReceiptPatternRule[] = [
  {
    id: "groceries",
    pattern: /\b(tesco|sainsbury|asda|aldi|lidl|morrisons|waitrose|co-?op)\b/i,
    businessChoiceId: "stock_materials",
    personalChoiceId: "groceries",
    summaryTitle: "Groceries",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "fuel",
    pattern:
      /\b(fuel|petrol|diesel|unleaded|shell|\bbp\b|esso|texaco|morrisons fuel|tesco fuel|asda fuel|sainsbury'?s fuel)\b/i,
    businessChoiceId: "fuel_travel",
    personalChoiceId: "fuel",
    summaryTitle: "Business fuel expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "beauty_supplies",
    pattern:
      /\b(beauty|salon|brows?|lashes|pigment|needle|gloves|wipes|disinfectant|numbing|aftercare|makeup|cosmetic supplies?)\b/i,
    businessChoiceId: "stock_materials",
    summaryTitle: "Business supplies",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "software",
    pattern:
      /\b(software|subscription|canva|cursor|adobe|booksy|saas|app store)\b/i,
    businessChoiceId: "software_digital",
    summaryTitle: "Business software expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "advertising",
    pattern:
      /\b(ads?|meta ads|facebook ads|instagram ads|google ads|marketing)\b/i,
    businessChoiceId: "advertising_marketing",
    summaryTitle: "Business advertising expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "training",
    pattern: /\b(course|academy|training|certificate|cpd)\b/i,
    businessChoiceId: "training_education",
    summaryTitle: "Business training expense",
    evidenceHint: "Receipt saved as proof.",
  },
];

const INCOME_HINT_PATTERN =
  /\b(cash received|payment received|paid to you|turnover|sales receipt|income)\b/i;

function normalizeReceiptText(
  merchant: string | null | undefined,
  rawText: string | null | undefined
): string {
  return [merchant, rawText].filter(Boolean).join("\n").toLowerCase();
}

export function classifyReceiptText(
  merchant: string | null | undefined,
  rawText: string | null | undefined
): ReceiptTextClassification {
  const text = normalizeReceiptText(merchant, rawText);

  if (!text.trim()) {
    return {
      businessChoiceId: null,
      personalChoiceId: null,
      summaryTitle: null,
      patternId: null,
      evidenceHint: null,
      looksBusinessRelevant: false,
      mayBeIncome: false,
    };
  }

  for (const rule of RECEIPT_PATTERNS) {
    if (rule.pattern.test(text)) {
      return {
        businessChoiceId: rule.businessChoiceId,
        personalChoiceId: rule.personalChoiceId ?? null,
        summaryTitle: rule.summaryTitle,
        patternId: rule.id,
        evidenceHint: rule.evidenceHint,
        looksBusinessRelevant: true,
        mayBeIncome: INCOME_HINT_PATTERN.test(text),
      };
    }
  }

  return {
    businessChoiceId: null,
    personalChoiceId: null,
    summaryTitle: null,
    patternId: null,
    evidenceHint: "Receipt saved as proof.",
    looksBusinessRelevant: false,
    mayBeIncome: INCOME_HINT_PATTERN.test(text),
  };
}

export function suggestDefaultPurpose(
  financeMode: FinanceMode,
  classification: ReceiptTextClassification
): ReceiptPurpose {
  if (!showsBusinessFeatures(financeMode)) {
    return "personal";
  }
  if (classification.looksBusinessRelevant) {
    return "business";
  }
  if (classification.mayBeIncome) {
    return "not_sure";
  }
  return "not_sure";
}

export function choiceIdForPurpose(
  purpose: ReceiptPurpose,
  classification: ReceiptTextClassification
): CategoryChoiceId | null {
  if (purpose === "business" && classification.businessChoiceId) {
    return classification.businessChoiceId;
  }
  if (purpose === "personal" && classification.personalChoiceId) {
    return classification.personalChoiceId;
  }
  if (purpose === "personal") {
    return "other_personal_expense";
  }
  if (purpose === "business") {
    return "other_business_expense";
  }
  return null;
}
