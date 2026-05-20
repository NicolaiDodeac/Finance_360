import type { CategoryRow } from "@/lib/categories/queries";
import {
  canonicalMerchantGroupKey,
  merchantGroupDisplayLabel,
} from "@/lib/categorization/normalize";
import { suggestCategoryForGroup } from "@/lib/categorization/suggestions";
import type { CategorySuggestion } from "@/lib/categorization/suggestions";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import type { ImportPreviewRow } from "@/lib/import/types";
import type { TransactionDirection } from "@/types/database";

export interface ImportPreviewMerchantGroup {
  groupKey: string;
  merchantLabel: string;
  rowCount: number;
  newCount: number;
  totalAmount: number;
  direction: TransactionDirection;
  suggestion: CategorySuggestion | null;
  hasRuleMatch: boolean;
}

function dominantDirection(rows: ImportPreviewRow[]): TransactionDirection {
  const counts = new Map<TransactionDirection, number>();
  for (const row of rows) {
    counts.set(row.direction, (counts.get(row.direction) ?? 0) + 1);
  }
  let best: TransactionDirection = rows[0]?.direction ?? "expense";
  let bestCount = 0;
  for (const [dir, count] of counts) {
    if (count > bestCount) {
      best = dir;
      bestCount = count;
    }
  }
  return best;
}

export function buildImportPreviewGroups(
  rows: ImportPreviewRow[],
  categories: CategoryRow[],
  rules: CategorizationRuleRow[]
): ImportPreviewMerchantGroup[] {
  const newRows = rows.filter((r) => r.status === "new");
  const uncategorisedNew = newRows.filter((r) => !r.category_id);
  const byKey = new Map<string, ImportPreviewRow[]>();

  for (const row of uncategorisedNew) {
    const key = canonicalMerchantGroupKey(row.description, row.merchant_name);
    if (!key) {
      continue;
    }
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }

  const groups: ImportPreviewMerchantGroup[] = [];

  for (const [groupKey, groupRows] of byKey) {
    if (groupRows.length < 2) {
      continue;
    }
    const representative = groupRows[0];
    const direction = dominantDirection(groupRows);
    const suggestion = suggestCategoryForGroup({
      groupKey,
      direction,
      description: representative.description,
      merchant_name: representative.merchant_name,
      categories,
      rules,
    });
    const hasRuleMatch = groupRows.some((r) => Boolean(r.matched_rule_name));

    groups.push({
      groupKey,
      merchantLabel: merchantGroupDisplayLabel(groupKey),
      rowCount: groupRows.length,
      newCount: groupRows.length,
      totalAmount: groupRows.reduce((sum, r) => sum + r.amount, 0),
      direction,
      suggestion,
      hasRuleMatch,
    });
  }

  return groups.sort((a, b) => b.rowCount - a.rowCount).slice(0, 8);
}
