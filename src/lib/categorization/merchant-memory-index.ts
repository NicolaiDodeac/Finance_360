import { canonicalMerchantGroupKey } from "@/lib/categorization/merchant-canonical";
import type { MerchantConfirmationStat } from "@/lib/categorization/merchant-memory";
import type { TransactionDirection } from "@/types/database";

export interface CategorisedTransactionForMemory {
  description: string | null;
  merchant_name: string | null;
  category_id: string;
  hmrc_category_id: string | null;
  is_business: boolean;
  direction: TransactionDirection;
  transaction_date: string;
  categoryName: string | null;
  categorySlug: string | null;
}

/**
 * In-memory index of merchant → most common confirmed category (per direction).
 */
export type MerchantMemoryIndex = Map<string, MerchantConfirmationStat>;

export function buildMerchantMemoryIndex(
  rows: CategorisedTransactionForMemory[]
): Map<string, MerchantConfirmationStat> {
  const byKey = new Map<
    string,
    Map<
      string,
      {
        categoryId: string;
        categoryName: string | null;
        categorySlug: string | null;
        hmrcCategoryId: string | null;
        isBusiness: boolean;
        usageCount: number;
        lastUsedAt: string;
      }
    >
  >();

  for (const row of rows) {
    const groupKey = canonicalMerchantGroupKey(
      row.description,
      row.merchant_name
    );
    if (!groupKey) continue;

    const memoryKey = `${row.direction}:${groupKey}`;
    const compositeKey = `${row.category_id}:${row.is_business}:${row.hmrc_category_id ?? ""}`;

    let directionMap = byKey.get(memoryKey);
    if (!directionMap) {
      directionMap = new Map();
      byKey.set(memoryKey, directionMap);
    }

    const existing = directionMap.get(compositeKey);
    if (existing) {
      existing.usageCount += 1;
      if (row.transaction_date > existing.lastUsedAt) {
        existing.lastUsedAt = row.transaction_date;
      }
    } else {
      directionMap.set(compositeKey, {
        categoryId: row.category_id,
        categoryName: row.categoryName,
        categorySlug: row.categorySlug,
        hmrcCategoryId: row.hmrc_category_id,
        isBusiness: row.is_business,
        usageCount: 1,
        lastUsedAt: row.transaction_date,
      });
    }
  }

  const result = new Map<string, MerchantConfirmationStat>();

  for (const [memoryKey, directionMap] of byKey) {
    let best: MerchantConfirmationStat | null = null;
    for (const entry of directionMap.values()) {
      if (!best || entry.usageCount > best.usageCount) {
        best = {
          categoryId: entry.categoryId,
          categoryName: entry.categoryName,
          categorySlug: entry.categorySlug,
          hmrcCategoryId: entry.hmrcCategoryId,
          isBusiness: entry.isBusiness,
          usageCount: entry.usageCount,
          lastUsedAt: entry.lastUsedAt,
        };
      }
    }
    if (best) result.set(memoryKey, best);
  }

  return result;
}

export function lookupMerchantMemory(
  index: Map<string, MerchantConfirmationStat>,
  direction: TransactionDirection,
  description: string | null,
  merchant_name: string | null
): MerchantConfirmationStat | null {
  const groupKey = canonicalMerchantGroupKey(description, merchant_name);
  if (!groupKey) return null;
  return index.get(`${direction}:${groupKey}`) ?? null;
}
