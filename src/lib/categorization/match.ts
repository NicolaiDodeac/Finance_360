import type {
  CategorizationRuleRow,
  RuleMatchableTransaction,
  RuleMatchField,
  RuleMatchType,
} from "@/lib/categorization/types";

function searchTexts(
  tx: RuleMatchableTransaction,
  matchField: RuleMatchField
): string[] {
  const description = (tx.description ?? "").trim();
  const merchant = (tx.merchant_name ?? "").trim();

  switch (matchField) {
    case "description":
      return description ? [description] : [];
    case "merchant_name":
      return merchant ? [merchant] : [];
    case "both":
      return [description, merchant].filter(Boolean);
    default:
      return [];
  }
}

function textMatchesKeyword(
  text: string,
  keyword: string,
  matchType: RuleMatchType
): boolean {
  const haystack = text.toLowerCase();
  const needle = keyword.toLowerCase().trim();

  if (!needle) {
    return false;
  }

  switch (matchType) {
    case "contains":
      return haystack.includes(needle);
    case "equals":
      return haystack === needle;
    case "starts_with":
      return haystack.startsWith(needle);
    case "regex":
      try {
        return new RegExp(keyword, "i").test(text);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function ruleMatchesTransaction(
  rule: CategorizationRuleRow,
  tx: RuleMatchableTransaction
): boolean {
  if (!rule.is_active) {
    return false;
  }

  const keyword = rule.match_value.trim();
  if (!keyword) {
    return false;
  }

  const texts = searchTexts(tx, rule.match_field);
  if (texts.length === 0) {
    return false;
  }

  return texts.some((text) =>
    textMatchesKeyword(text, keyword, rule.match_type)
  );
}

/** Highest priority first; stable tie-break by name. */
export function sortRulesByPriority(
  rules: CategorizationRuleRow[]
): CategorizationRuleRow[] {
  return [...rules].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.name.localeCompare(b.name);
  });
}

export function findMatchingRule(
  tx: RuleMatchableTransaction,
  rules: CategorizationRuleRow[]
): CategorizationRuleRow | null {
  const sorted = sortRulesByPriority(rules);
  return sorted.find((rule) => ruleMatchesTransaction(rule, tx)) ?? null;
}
