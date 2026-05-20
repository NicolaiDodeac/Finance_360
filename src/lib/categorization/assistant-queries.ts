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
