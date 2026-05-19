import { createClient } from "@/lib/supabase/server";
import { getTaxYears } from "@/lib/tax-years/queries";
import { UNCATEGORIZED_CATEGORY_FILTER } from "@/lib/transactions/links";
import type {
  TransactionFilters,
  TransactionWithRelations,
} from "@/lib/transactions/types";

const TRANSACTION_SELECT = `
  *,
  account:accounts(id, name),
  category:categories(id, name, slug),
  hmrc_category:hmrc_categories(id, code, name),
  tax_year:tax_years(id, label),
  receipt:receipts(id, original_filename, merchant_name, mime_type)
`;

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.direction && filters.direction !== "all") {
    query = query.eq("direction", filters.direction);
  }

  if (filters.scope === "business") {
    query = query.eq("is_business", true);
  } else if (filters.scope === "personal") {
    query = query.eq("is_business", false);
  }

  if (filters.categoryId === UNCATEGORIZED_CATEGORY_FILTER) {
    query = query.is("category_id", null);
  } else if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.taxYearId) {
    const taxYears = await getTaxYears(userId);
    const taxYear = taxYears.find((ty) => ty.id === filters.taxYearId);

    if (taxYear) {
      query = query.or(
        `tax_year_id.eq.${filters.taxYearId},and(tax_year_id.is.null,transaction_date.gte.${taxYear.start_date},transaction_date.lte.${taxYear.end_date})`
      );
    } else {
      query = query.eq("tax_year_id", filters.taxYearId);
    }
  }

  if (filters.from) {
    query = query.gte("transaction_date", filters.from);
  }

  if (filters.to) {
    query = query.lte("transaction_date", filters.to);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  let rows = (data ?? []) as TransactionWithRelations[];

  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    rows = rows.filter((tx) => {
      const description = (tx.description ?? "").toLowerCase();
      const merchant = (tx.merchant_name ?? "").toLowerCase();
      return description.includes(term) || merchant.includes(term);
    });
  }

  if (filters.hmrcCategoryIds?.length) {
    const idSet = new Set(filters.hmrcCategoryIds);
    rows = rows.filter(
      (tx) => tx.hmrc_category_id != null && idSet.has(tx.hmrc_category_id)
    );
  }

  return rows;
}

export async function getTransactionById(
  userId: string,
  transactionId: string
): Promise<TransactionWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("user_id", userId)
    .eq("id", transactionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as TransactionWithRelations | null) ?? null;
}
