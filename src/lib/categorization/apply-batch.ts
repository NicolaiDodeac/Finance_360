import {
  applyCategorizationRules,
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
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
  rawImportData: Record<string, unknown>
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

  return {
    category_id: applied.category_id,
    hmrc_category_id: applied.hmrc_category_id,
    is_business: applied.is_business ?? false,
    raw_import_data: mergeRawImportCategorization(rawImportData, metadata),
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
