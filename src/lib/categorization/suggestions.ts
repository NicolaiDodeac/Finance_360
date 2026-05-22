import type { CategoryRow } from "@/lib/categories/queries";
import { looksLikeEatingOut } from "@/lib/categorization/eating-out-detect";
import { normalizeMerchantGroupKey } from "@/lib/categorization/normalize";
import { looksLikeTaxPayment } from "@/lib/categorization/tax-payment-detect";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import { findMatchingRule } from "@/lib/categorization/match";
import type { TransactionDirection } from "@/types/database";

export type SuggestionConfidence = "high" | "medium" | "low";

export interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  hmrcCategoryId: string | null;
  isBusiness: boolean;
  confidence: SuggestionConfidence;
  reason: string;
  source: "rule" | "pattern";
  ruleId?: string;
  ruleName?: string;
}

interface PatternRule {
  test: (key: string, direction: TransactionDirection) => boolean;
  categorySlug: string;
  confidence: SuggestionConfidence;
  reason: string;
  isBusiness?: boolean;
}

const PATTERN_RULES: PatternRule[] = [
  {
    test: (key, dir) => dir === "expense" && looksLikeTaxPayment(key),
    categorySlug: "tax-payment",
    confidence: "high",
    reason: "Looks like a tax payment to HMRC",
    isBusiness: false,
  },
  {
    test: (key, dir) =>
      dir === "income" &&
      (key.includes("MAGNA") ||
        key.includes("SALARY") ||
        key.includes("PAYROLL") ||
        key.includes("WAGES")),
    categorySlug: "salary",
    confidence: "high",
    reason: "Looks like salary or payroll",
  },
  {
    test: (key) => key.includes("TESCO INSURANCE"),
    categorySlug: "insurance",
    confidence: "high",
    reason: "Insurance payment",
  },
  {
    test: (key) =>
      key.includes("NETFLIX") ||
      key.includes("SPOTIFY") ||
      key.includes("DISNEY") ||
      key.includes("PRIME VIDEO") ||
      key.includes("NOW TV"),
    categorySlug: "subscriptions",
    confidence: "high",
    reason: "Streaming or subscription service",
  },
  {
    test: (key) =>
      key.includes("CURSOR") ||
      key.includes("GITHUB") ||
      key.includes("OPENAI") ||
      key.includes("CHATGPT"),
    categorySlug: "subscriptions",
    confidence: "high",
    reason: "Software or online service",
  },
  {
    test: (key) =>
      (key.includes("APPLE") ||
        key.includes("GOOGLE") ||
        key.includes("MICROSOFT")) &&
      !key.includes("PAY"),
    categorySlug: "subscriptions",
    confidence: "medium",
    reason: "Common app or cloud subscription",
  },
  {
    test: (key) =>
      key.includes("OCTOPUS") ||
      key.includes("SEVERN TRENT") ||
      key.includes("BRITISH GAS") ||
      key.includes("EDF") ||
      key.includes("EON"),
    categorySlug: "utilities",
    confidence: "high",
    reason: "Utility provider",
  },
  {
    test: (key, dir) => dir === "expense" && looksLikeEatingOut(key),
    categorySlug: "eating-out",
    confidence: "high",
    reason: "Looks like a restaurant, café, or food delivery",
    isBusiness: false,
  },
  {
    test: (key) => key.includes("TESCO") && !key.includes("INSURANCE"),
    categorySlug: "groceries",
    confidence: "high",
    reason: "Supermarket",
  },
  {
    test: (key, dir) =>
      dir === "expense" &&
      (key.includes("SHELL") ||
        key.includes(" BP ") ||
        key.startsWith("BP ") ||
        key.includes("ESSO") ||
        key.includes("TEXACO")),
    categorySlug: "fuel",
    confidence: "medium",
    reason: "Fuel station — confirm if business or personal",
    isBusiness: false,
  },
  {
    test: (key) => key.includes("MONEYBOX"),
    categorySlug: "savings-transfer",
    confidence: "high",
    reason: "Savings or investment transfer",
  },
  {
    test: (key) =>
      key.includes("LLOYDS BANK CREDIT") ||
      key.includes("M S LOANS") ||
      key.includes("MS LOANS") ||
      key.includes("NOVUNA") ||
      key.includes("CREDIT CARD PAYMENT"),
    categorySlug: "other-expense",
    confidence: "high",
    reason: "Loan or credit repayment",
  },
  {
    test: (key) => key.includes("PARENTPAY"),
    categorySlug: "children-family",
    confidence: "high",
    reason: "School or family payment",
  },
  {
    test: (key) => key.includes("LEBARA"),
    categorySlug: "phone-internet",
    confidence: "high",
    reason: "Mobile provider",
  },
  {
    test: (key) =>
      key.includes("DAILY OD INT") ||
      key.includes("DAILY OD CHG") ||
      key.includes("OVERDRAFT FEE") ||
      key.includes("BANK CHARGE"),
    categorySlug: "bank-fees",
    confidence: "high",
    reason: "Bank fee or overdraft charge",
  },
];

function findCategoryBySlug(
  categories: CategoryRow[],
  slug: string
): CategoryRow | null {
  return categories.find((c) => c.slug === slug) ?? null;
}

export function suggestCategoryForGroup(input: {
  groupKey: string;
  direction: TransactionDirection;
  description: string | null;
  merchant_name: string | null;
  categories: CategoryRow[];
  rules: CategorizationRuleRow[];
}): CategorySuggestion | null {
  const representative = {
    description: input.description,
    merchant_name: input.merchant_name,
  };

  const matchedRule = findMatchingRule(representative, input.rules);
  if (matchedRule && (matchedRule.category_id || matchedRule.hmrc_category_id)) {
    const category = input.categories.find(
      (c) => c.id === matchedRule.category_id
    );
    return {
      categoryId: matchedRule.category_id,
      categoryName: category?.name ?? null,
      hmrcCategoryId: matchedRule.hmrc_category_id,
      isBusiness: matchedRule.is_business ?? false,
      confidence: "high",
      reason: `Existing rule: ${matchedRule.name}`,
      source: "rule",
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
    };
  }

  const key =
    input.groupKey ||
    normalizeMerchantGroupKey(input.description, input.merchant_name);

  for (const pattern of PATTERN_RULES) {
    if (!pattern.test(key, input.direction)) {
      continue;
    }
    const category = findCategoryBySlug(input.categories, pattern.categorySlug);
    if (!category) {
      continue;
    }
    return {
      categoryId: category.id,
      categoryName: category.name,
      hmrcCategoryId: null,
      isBusiness: pattern.isBusiness ?? false,
      confidence: pattern.confidence,
      reason: pattern.reason,
      source: "pattern",
    };
  }

  return null;
}

export function isHighConfidenceSuggestion(
  suggestion: CategorySuggestion | null
): suggestion is CategorySuggestion {
  return suggestion?.confidence === "high";
}
