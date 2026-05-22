import { findMatchingRule } from "@/lib/categorization/match";
import type {
  CategorizationMetadata,
  CategorizationRuleRow,
  RuleApplication,
  RuleMatchableTransaction,
} from "@/lib/categorization/types";

export interface ApplyRulesOptions {
  /** Only set category/HMRC/business when currently unset. */
  onlyFillEmpty?: boolean;
  existing?: {
    category_id?: string | null;
    hmrc_category_id?: string | null;
    is_business?: boolean;
  };
}

export function applyCategorizationRules(
  tx: RuleMatchableTransaction,
  rules: CategorizationRuleRow[],
  options: ApplyRulesOptions = {}
): RuleApplication {
  const matched = findMatchingRule(tx, rules);
  const onlyFillEmpty = options.onlyFillEmpty ?? true;
  const existing = options.existing ?? {};

  if (!matched) {
    return {
      category_id: existing.category_id ?? null,
      hmrc_category_id: existing.hmrc_category_id ?? null,
      is_business: existing.is_business ?? null,
      matched_rule: null,
    };
  }

  const isBusiness =
    matched.is_business !== null
      ? matched.is_business
      : (existing.is_business ?? false);

  const categoryId =
    onlyFillEmpty && existing.category_id
      ? existing.category_id
      : matched.category_id;

  const hmrcFromRule = isBusiness ? matched.hmrc_category_id : null;
  const hmrcCategoryId =
    onlyFillEmpty && existing.hmrc_category_id
      ? existing.hmrc_category_id
      : hmrcFromRule;

  return {
    category_id: categoryId,
    hmrc_category_id: hmrcCategoryId,
    is_business: isBusiness,
    matched_rule: matched,
  };
}

export function buildCategorizationMetadata(
  rule: CategorizationRuleRow
): CategorizationMetadata {
  return {
    rule_id: rule.id,
    rule_name: rule.name,
    applied_at: new Date().toISOString(),
  };
}

export function mergeRawImportCategorization(
  raw: Record<string, unknown> | null | undefined,
  metadata: CategorizationMetadata | null
): Record<string, unknown> {
  const base = { ...(raw ?? {}) };
  if (metadata) {
    base.categorization = metadata;
  }
  return base;
}

export function getCategorizationFromRaw(
  raw: Record<string, unknown> | null | undefined
): CategorizationMetadata | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw.categorization;
  if (
    value &&
    typeof value === "object" &&
    "rule_id" in value &&
    typeof (value as CategorizationMetadata).rule_id === "string"
  ) {
    return value as CategorizationMetadata;
  }

  return null;
}
