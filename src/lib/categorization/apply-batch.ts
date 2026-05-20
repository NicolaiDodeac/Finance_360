import {
  applyCategorizationRules,
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
import { mergeRuleFlowTypeMetadata } from "@/lib/categorization/rule-flow-type";
import type { CategoryRow } from "@/lib/categories/queries";
import type {
  CategorizationRuleRow,
  RuleMatchableTransaction,
} from "@/lib/categorization/types";

export interface CategorizedTransactionFields {
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean;
  raw_import_data: Record<string, unknown>;
  matched_rule_id: string | null;
  matched_rule_name: string | null;
}

export function applyRulesToImportRow(
  tx: RuleMatchableTransaction,
  rules: CategorizationRuleRow[],
  rawImportData: Record<string, unknown>,
  options?: {
    direction?: string;
    categories?: CategoryRow[];
  }
): CategorizedTransactionFields {
  const applied = applyCategorizationRules(tx, rules, {
    onlyFillEmpty: true,
    existing: {
      category_id: null,
      hmrc_category_id: null,
      is_business: false,
    },
  });

  const metadata = applied.matched_rule
    ? buildCategorizationMetadata(applied.matched_rule)
    : null;

  let raw = mergeRawImportCategorization(rawImportData, metadata);

  if (applied.matched_rule && applied.category_id && options?.categories) {
    const category = options.categories.find((c) => c.id === applied.category_id);
    const isBusiness = applied.is_business ?? false;
    raw = mergeRuleFlowTypeMetadata(raw, {
      categorySlug: category?.slug,
      direction: options.direction ?? "expense",
      isBusiness,
    });
  }

  return {
    category_id: applied.category_id,
    hmrc_category_id: applied.hmrc_category_id,
    is_business: applied.is_business ?? false,
    raw_import_data: raw,
    matched_rule_id: applied.matched_rule?.id ?? null,
    matched_rule_name: applied.matched_rule?.name ?? null,
  };
}

export function collectMatchedRuleIds(
  rows: Array<{ matched_rule_id: string | null }>
): string[] {
  return rows
    .map((row) => row.matched_rule_id)
    .filter((id): id is string => Boolean(id));
}
