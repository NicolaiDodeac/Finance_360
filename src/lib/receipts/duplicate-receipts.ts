import { createClient } from "@/lib/supabase/server";
import { scoreMerchantTier } from "@/lib/receipts/match";
import type { ReceiptRow, ReceiptWithRelations } from "@/lib/receipts/types";

export interface SimilarReceiptInfo {
  receipt: Pick<
    ReceiptRow,
    "id" | "merchant_name" | "receipt_date" | "total_amount" | "original_filename"
  >;
  hasLinkedTransaction: boolean;
}

/**
 * Other receipts that look like the same purchase (duplicate uploads).
 */
export async function findSimilarReceipts(
  userId: string,
  receipt: Pick<
    ReceiptRow,
    "id" | "merchant_name" | "receipt_date" | "total_amount"
  >
): Promise<SimilarReceiptInfo[]> {
  if (receipt.total_amount === null || !receipt.receipt_date) {
    return [];
  }

  const amount = Number(receipt.total_amount);
  if (!Number.isFinite(amount)) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("id, merchant_name, receipt_date, total_amount, original_filename")
    .eq("user_id", userId)
    .eq("receipt_date", receipt.receipt_date)
    .gte("total_amount", amount - 0.02)
    .lte("total_amount", amount + 0.02)
    .neq("id", receipt.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data?.length) return [];

  const { data: linked } = await supabase
    .from("transactions")
    .select("receipt_id")
    .eq("user_id", userId)
    .in(
      "receipt_id",
      data.map((r) => r.id)
    );

  const linkedIds = new Set(
    (linked ?? []).map((t) => t.receipt_id).filter(Boolean)
  );

  const results: SimilarReceiptInfo[] = [];

  for (const row of data) {
    const tier = scoreMerchantTier(
      receipt.merchant_name,
      row.merchant_name,
      null
    );
    if (tier === "contradictory" || tier === "none") continue;
    results.push({
      receipt: row as SimilarReceiptInfo["receipt"],
      hasLinkedTransaction: linkedIds.has(row.id),
    });
  }

  return results;
}

export async function findSimilarReceiptsWithRelations(
  userId: string,
  receiptId: string
): Promise<ReceiptWithRelations[]> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("receipts")
    .select("id, merchant_name, receipt_date, total_amount")
    .eq("id", receiptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!current) return [];

  const similar = await findSimilarReceipts(userId, current as ReceiptRow);
  if (similar.length === 0) return [];

  const { getReceiptById } = await import("@/lib/receipts/queries");
  const loaded = await Promise.all(
    similar.map((s) => getReceiptById(userId, s.receipt.id))
  );
  return loaded.filter((r): r is ReceiptWithRelations => r !== null);
}
