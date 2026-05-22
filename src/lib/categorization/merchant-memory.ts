import type { CategoryRow } from "@/lib/categories/queries";
import { normalizeMerchantGroupKey } from "@/lib/categorization/normalize";
import {
  suggestCategoryForGroup,
  type CategorySuggestion,
  type SuggestionConfidence,
} from "@/lib/categorization/suggestions";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import type { TransactionDirection } from "@/types/database";

/** Minimum past confirmations before behaviour memory overrides patterns. */
export const MERCHANT_MEMORY_CONFIRM_THRESHOLD = 5;

export interface MerchantConfirmationStat {
  categoryId: string;
  categoryName: string | null;
  categorySlug: string | null;
  hmrcCategoryId: string | null;
  isBusiness: boolean;
  usageCount: number;
  lastUsedAt: string;
}

export interface MerchantMemorySuggestion extends CategorySuggestion {
  memorySource?: "confirmed_history" | "rule" | "pattern";
  usageCount?: number;
}

function confidenceFromUsage(count: number): SuggestionConfidence {
  if (count >= MERCHANT_MEMORY_CONFIRM_THRESHOLD) return "high";
  if (count >= 2) return "medium";
  return "low";
}

/**
 * Behaviour-first merchant memory: confirmed history → rules → patterns.
 */
export function suggestWithMerchantMemory(input: {
  groupKey: string;
  direction: TransactionDirection;
  description: string | null;
  merchant_name: string | null;
  categories: CategoryRow[];
  rules: CategorizationRuleRow[];
  confirmedHistory?: MerchantConfirmationStat | null;
}): MerchantMemorySuggestion | null {
  const key =
    input.groupKey ||
    normalizeMerchantGroupKey(input.description, input.merchant_name);

  if (input.confirmedHistory) {
    const stat = input.confirmedHistory;
    const category = input.categories.find((c) => c.id === stat.categoryId);
    const count = stat.usageCount;
    const conf = confidenceFromUsage(count);
    const label = category?.name ?? stat.categoryName ?? "Category";
    return {
      categoryId: stat.categoryId,
      categoryName: label,
      hmrcCategoryId: stat.hmrcCategoryId,
      isBusiness: stat.isBusiness,
      confidence: conf,
      reason:
        count >= MERCHANT_MEMORY_CONFIRM_THRESHOLD
          ? `Usually categorised as ${label}`
          : `Often categorised as ${label} (${count} times)`,
      source: "rule",
      memorySource: "confirmed_history",
      usageCount: count,
    };
  }

  const base = suggestCategoryForGroup({
    groupKey: key,
    direction: input.direction,
    description: input.description,
    merchant_name: input.merchant_name,
    categories: input.categories,
    rules: input.rules,
  });

  if (!base) return null;

  return {
    ...base,
    memorySource: base.source === "rule" ? "rule" : "pattern",
  };
}
