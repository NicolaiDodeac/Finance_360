import { createClient } from "@/lib/supabase/server";
import { getTaxYears } from "@/lib/tax-years/queries";
import { RECEIPTS_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from "@/lib/receipts/constants";
import type {
  ReceiptAttachedTransaction,
  ReceiptRow,
  ReceiptWithRelations,
} from "@/lib/receipts/types";

const ATTACHED_TRANSACTION_SELECT =
  "id, transaction_date, description, merchant_name, amount, direction, is_business, receipt_id, category_id, hmrc_category_id, tax_year_id, account_id, category:categories(id, name), hmrc:hmrc_categories(id, name), account:accounts(id, name, account_type), linked_receipt:receipts(id, merchant_name, original_filename, total_amount, receipt_date)";

function attachTaxYears(
  rows: ReceiptRow[],
  taxYearsById: Map<string, { id: string; label: string }>
): Omit<ReceiptWithRelations, "attached_transaction">[] {
  return rows.map((row) => ({
    ...row,
    tax_year: row.tax_year_id
      ? (taxYearsById.get(row.tax_year_id) ?? null)
      : null,
  }));
}

async function loadTaxYearsById(userId: string) {
  const taxYears = await getTaxYears(userId);
  return new Map(taxYears.map((ty) => [ty.id, { id: ty.id, label: ty.label }]));
}

export async function getReceipts(
  userId: string
): Promise<ReceiptWithRelations[]> {
  const supabase = await createClient();

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (receipts ?? []) as ReceiptRow[];

  if (rows.length === 0) {
    return [];
  }

  const taxYearsById = await loadTaxYearsById(userId);
  const withTaxYears = attachTaxYears(rows, taxYearsById);

  const receiptIds = rows.map((row) => row.id);
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select(ATTACHED_TRANSACTION_SELECT)
    .eq("user_id", userId)
    .in("receipt_id", receiptIds);

  if (txError) {
    throw new Error(txError.message);
  }

  const byReceiptId = new Map<string, ReceiptAttachedTransaction>();
  for (const tx of transactions ?? []) {
    if (tx.receipt_id) {
      byReceiptId.set(tx.receipt_id, mapAttachedTransaction(tx));
    }
  }

  return withTaxYears.map((row) => ({
    ...row,
    attached_transaction: byReceiptId.get(row.id) ?? null,
  }));
}

export async function getReceiptById(
  userId: string,
  receiptId: string
): Promise<ReceiptWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", receiptId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const row = data as ReceiptRow;
  const taxYearsById = await loadTaxYearsById(userId);

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .select(ATTACHED_TRANSACTION_SELECT)
    .eq("user_id", userId)
    .eq("receipt_id", receiptId)
    .maybeSingle();

  if (txError) {
    throw new Error(txError.message);
  }

  const [withTaxYear] = attachTaxYears([row], taxYearsById);

  return {
    ...withTaxYear,
    attached_transaction: transaction
      ? mapAttachedTransaction(transaction)
      : null,
  };
}

function mapAttachedTransaction(tx: unknown): ReceiptAttachedTransaction {
  const row = tx as ReceiptAttachedTransaction & {
    category?: { name?: string } | null;
    hmrc?: { name?: string } | null;
  };
  return {
    ...row,
    category_name: row.category?.name ?? null,
    hmrc_category_name: row.hmrc?.name ?? null,
  };
}

export async function getUnmatchedReceipts(
  userId: string
): Promise<ReceiptWithRelations[]> {
  const all = await getReceipts(userId);
  return all.filter((receipt) => !receipt.attached_transaction);
}

export async function getMatchableTransactions(
  userId: string,
  options?: { taxYearId?: string | null }
): Promise<ReceiptAttachedTransaction[]> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(ATTACHED_TRANSACTION_SELECT)
    .eq("user_id", userId)
    .neq("direction", "transfer")
    .order("transaction_date", { ascending: false })
    .limit(200);

  if (options?.taxYearId) {
    query = query.or(
      `tax_year_id.eq.${options.taxYearId},tax_year_id.is.null`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReceiptAttachedTransaction[];
}

export async function getUnattachedReceiptsForUser(
  userId: string
): Promise<ReceiptWithRelations[]> {
  return getUnmatchedReceipts(userId);
}

export async function createReceiptSignedUrl(
  storagePath: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
