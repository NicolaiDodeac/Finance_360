import { createClient } from "@/lib/supabase/server";
import type { ExistingTransactionFingerprint } from "@/lib/import/dedupe";

export async function getExistingTransactionsForImport(
  userId: string,
  accountId: string,
  dateFrom: string,
  dateTo: string
): Promise<ExistingTransactionFingerprint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_date, amount, direction, description, merchant_name")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .gte("transaction_date", dateFrom)
    .lte("transaction_date", dateTo);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExistingTransactionFingerprint[];
}
