import { canonicalMerchantGroupKey } from "@/lib/categorization/merchant-canonical";
import type { MerchantConfirmationStat } from "@/lib/categorization/merchant-memory";
import { createClient } from "@/lib/supabase/server";
import type { TransactionDirection } from "@/types/database";

interface HistoryRow {
  category_id: string;
  hmrc_category_id: string | null;
  is_business: boolean;
  transaction_date: string;
  description: string | null;
  merchant_name: string | null;
  categories: { id: string; name: string; slug: string } | null;
}

/**
 * Most common category for a merchant among categorised transactions (user confirmations).
 */
export async function getMerchantConfirmationStat(
  userId: string,
  merchantLabel: string,
  direction: TransactionDirection
): Promise<MerchantConfirmationStat | null> {
  const targetKey = canonicalMerchantGroupKey(merchantLabel, merchantLabel);
  if (!targetKey) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "category_id, hmrc_category_id, is_business, transaction_date, description, merchant_name, categories(id, name, slug)"
    )
    .eq("user_id", userId)
    .eq("direction", direction)
    .not("category_id", "is", null)
    .order("transaction_date", { ascending: false })
    .limit(300);

  if (error || !data?.length) return null;

  const counts = new Map<
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
  >();

  for (const row of data as HistoryRow[]) {
    const cat = row.categories;
    if (!cat || !row.category_id) continue;

    const rowKey = canonicalMerchantGroupKey(
      row.description,
      row.merchant_name
    );
    if (rowKey !== targetKey) continue;

    const compositeKey = `${row.category_id}:${row.is_business}:${row.hmrc_category_id ?? ""}`;
    const existing = counts.get(compositeKey);
    if (existing) {
      existing.usageCount += 1;
      if (row.transaction_date > existing.lastUsedAt) {
        existing.lastUsedAt = row.transaction_date;
      }
    } else {
      counts.set(compositeKey, {
        categoryId: row.category_id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        hmrcCategoryId: row.hmrc_category_id,
        isBusiness: row.is_business,
        usageCount: 1,
        lastUsedAt: row.transaction_date,
      });
    }
  }

  let best: MerchantConfirmationStat | null = null;
  for (const entry of counts.values()) {
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

  return best;
}
