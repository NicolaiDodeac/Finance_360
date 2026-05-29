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

/**
 * Deterministic merchant/item keyword groups, in priority order
 * (first match wins). More specific groups (fuel, beauty supplies) come before
 * generic ones (groceries) so "Tesco fuel" maps to fuel, not groceries.
 */
const RECEIPT_PATTERNS: ReceiptPatternRule[] = [
  {
    id: "fuel",
    pattern:
      /\b(fuel|petrol|diesel|unleaded|shell|\bbp\b|esso|texaco|gulf|jet|morrisons fuel|tesco fuel|asda fuel|sainsbury'?s fuel)\b/i,
    businessChoiceId: "fuel_travel",
    personalChoiceId: "fuel",
    summaryTitle: "Business fuel expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "travel",
    pattern:
      /\b(parking|car park|toll|congestion charge|train|rail|bus fare|taxi|uber(?! eats)|trainline|tfl)\b/i,
    businessChoiceId: "fuel_travel",
    personalChoiceId: "transport",
    summaryTitle: "Business travel expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "diy_hardware",
    pattern:
      /\b(b\s*&\s*q|b\s*and\s*q|screwfix|wickes|homebase|toolstation|travis perkins|jewson|builders?\s+merchant|hardware|timber|plywood|screws?|nails?|plaster(?:board)?|cement|sealant|grout|decking|paving|insulation|weedkiller|secateur|compost|topsoil)\b/i,
    businessChoiceId: "stock_materials",
    personalChoiceId: "other_personal_expense",
    summaryTitle: "Materials / DIY",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "beauty_supplies",
    pattern:
      /\b(beauty|salon|brows?|lashes|pigment|needle|gloves|wipes|disinfectant|numbing|aftercare|cosmetics?|makeup supplies?)\b/i,
    businessChoiceId: "stock_materials",
    personalChoiceId: "other_personal_expense",
    summaryTitle: "Business supplies",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "software",
    pattern:
      /\b(software|canva|cursor|adobe|booksy|saas|app\s+subscription|digital subscription)\b/i,
    businessChoiceId: "software_digital",
    personalChoiceId: "subscriptions",
    summaryTitle: "Business software expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "advertising",
    pattern:
      /\b(ads?|meta ads|facebook ads|instagram ads|google ads|marketing|sponsored)\b/i,
    businessChoiceId: "advertising_marketing",
    summaryTitle: "Business advertising expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "training",
    pattern: /\b(course|academy|training|certificate|cpd|workshop|masterclass)\b/i,
    businessChoiceId: "training_education",
    personalChoiceId: "education",
    summaryTitle: "Business training expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "office_equipment",
    pattern:
      /\b(stationery|printer|ink|toner|laptop|computer|tools?|equipment|office supplies?)\b/i,
    businessChoiceId: "equipment_tools",
    personalChoiceId: "other_personal_expense",
    summaryTitle: "Business equipment expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "eating_out",
    pattern:
      /\b(restaurant|cafe|caf\u00e9|coffee|takeaway|deliveroo|just eat|uber eats|greggs|costa|starbucks|kfc|mcdonald'?s|pret|nando'?s|pub|\bbar\b|bistro|diner)\b/i,
    businessChoiceId: "other_business_expense",
    personalChoiceId: "eating_out",
    summaryTitle: "Meal expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "health",
    pattern:
      /\b(pharmacy|boots|superdrug|chemist|medical|dentist|optician|prescription)\b/i,
    businessChoiceId: "other_business_expense",
    personalChoiceId: "health",
    summaryTitle: "Health expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "bills_utilities",
    pattern:
      /\b(electricity|\bgas\b|water rates|broadband|wifi|phone bill|mobile bill|line rental|utilities?)\b/i,
    businessChoiceId: "premises_utilities",
    personalChoiceId: "utilities",
    summaryTitle: "Utilities expense",
    evidenceHint: "Receipt saved as proof.",
  },
  {
    id: "groceries",
    pattern:
      /\b(supermarket|groceries|tesco|sainsbury|asda|aldi|lidl|morrisons|waitrose|co-?op|iceland|m\s?&\s?s food)\b/i,
    businessChoiceId: "stock_materials",
    personalChoiceId: "groceries",
    summaryTitle: "Groceries",
    evidenceHint: "Receipt saved as proof.",
  },
];

/**
 * Groups that are ambiguous or usually personal — don't default to a business
 * purpose. The user picks business/personal and the category still maps
 * sensibly either way. DIY/building materials are genuinely either (home
 * improvement vs. trade materials), so we let the user decide.
 */
const PERSONAL_LEANING_PATTERNS = new Set([
  "groceries",
  "eating_out",
  "health",
  "travel",
  "bills_utilities",
  "diy_hardware",
]);

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
        // Personal-leaning groups (groceries, eating out, health, travel,
        // bills) should not default to a business purpose.
        looksBusinessRelevant: !PERSONAL_LEANING_PATTERNS.has(rule.id),
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
