import { isReviewRecommended } from "@/lib/categorization/assistant-metadata";
import type { AssistantTransactionRow } from "@/lib/categorization/assistant-types";
import { createClient } from "@/lib/supabase/server";

const ASSISTANT_SELECT =
  "id, description, merchant_name, amount, direction, transaction_date, category_id, hmrc_category_id, is_business, raw_import_data";

/** Transactions needing categorisation or re-review (uncategorised, not deferred). */
export function filterAssistantQueue(
  rows: AssistantTransactionRow[]
): AssistantTransactionRow[] {
  return rows.filter(
    (tx) => !tx.category_id && !isReviewRecommended(tx.raw_import_data)
  );
}

export async function getUncategorisedTransactionsForAssistant(
  userId: string
): Promise<AssistantTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(ASSISTANT_SELECT)
    .eq("user_id", userId)
    .is("category_id", null)
    .order("transaction_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return filterAssistantQueue((data ?? []) as AssistantTransactionRow[]);
}

/** Uncategorised rows flagged for review (deferred in the assistant). */
export async function getReviewDeferredTransactionCount(
  userId: string
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(ASSISTANT_SELECT)
    .eq("user_id", userId)
    .is("category_id", null);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AssistantTransactionRow[]).filter((tx) =>
    isReviewRecommended(tx.raw_import_data)
  ).length;
}

/** Recent categorised transactions for merchant behaviour memory. */
export async function getCategorisedTransactionsForMemory(
  userId: string,
  limit = 400
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "description, merchant_name, category_id, hmrc_category_id, is_business, direction, transaction_date, categories(name, slug)"
    )
    .eq("user_id", userId)
    .not("category_id", "is", null)
    .order("transaction_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const cat = row.categories as { name: string; slug: string } | null;
    return {
      description: row.description as string | null,
      merchant_name: row.merchant_name as string | null,
      category_id: row.category_id as string,
      hmrc_category_id: row.hmrc_category_id as string | null,
      is_business: row.is_business as boolean,
      direction: row.direction as import("@/types/database").TransactionDirection,
      transaction_date: row.transaction_date as string,
      categoryName: cat?.name ?? null,
      categorySlug: cat?.slug ?? null,
    };
  });
}

export async function getUncategorisedTransactionCount(
  userId: string
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("category_id", null);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
