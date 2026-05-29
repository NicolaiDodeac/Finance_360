import { createClient } from "@/lib/supabase/server";
import { getTaxYears } from "@/lib/tax-years/queries";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import {
  paginationRange,
  parsePageParam,
  type PaginatedResult,
} from "@/lib/pagination/types";
import { UNCATEGORIZED_CATEGORY_FILTER } from "@/lib/transactions/links";
import type {
  TransactionFilters,
  TransactionWithRelations,
} from "@/lib/transactions/types";

export const TRANSACTIONS_PAGE_SIZE = 25;

const TRANSACTION_SELECT = `
  *,
  account:accounts(id, name),
  category:categories(id, name, slug),
  hmrc_category:hmrc_categories(id, code, name),
  tax_year:tax_years(id, label),
  receipt:receipts(id, original_filename, merchant_name, mime_type)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionQueryBuilder = any;

async function resolveTaxYearForFilter(
  userId: string,
  taxYearId: string | undefined
): Promise<TaxYearRow | null | undefined> {
  if (!taxYearId) return undefined;
  const taxYears = await getTaxYears(userId);
  return taxYears.find((ty) => ty.id === taxYearId) ?? null;
}

/**
 * Sync only — Supabase query builders are PromiseLike. Never return a builder
 * from an async function (Promise.resolve(builder) executes the query).
 */
function applyTransactionFilters(
  query: TransactionQueryBuilder,
  userId: string,
  filters: TransactionFilters,
  taxYear: TaxYearRow | null | undefined
): TransactionQueryBuilder {
  let next = query.eq("user_id", userId);

  if (filters.direction && filters.direction !== "all") {
    next = next.eq("direction", filters.direction);
  }

  if (filters.scope === "business") {
    next = next.eq("is_business", true);
  } else if (filters.scope === "personal") {
    next = next.eq("is_business", false);
  }

  if (filters.categoryId === UNCATEGORIZED_CATEGORY_FILTER) {
    next = next.is("category_id", null);
  } else if (filters.categoryId) {
    next = next.eq("category_id", filters.categoryId);
  }

  if (filters.taxYearId) {
    if (taxYear) {
      next = next.or(
        `tax_year_id.eq.${filters.taxYearId},and(tax_year_id.is.null,transaction_date.gte.${taxYear.start_date},transaction_date.lte.${taxYear.end_date})`
      );
    } else {
      next = next.eq("tax_year_id", filters.taxYearId);
    }
  }

  if (filters.from) {
    next = next.gte("transaction_date", filters.from);
  }

  if (filters.to) {
    next = next.lte("transaction_date", filters.to);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%_\\]/g, "\\$&");
    next = next.or(
      `description.ilike.%${term}%,merchant_name.ilike.%${term}%`
    );
  }

  if (filters.hmrcCategoryIds?.length) {
    next = next.in("hmrc_category_id", filters.hmrcCategoryIds);
  }

  return next;
}

function buildTransactionQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  filters: TransactionFilters,
  taxYear: TaxYearRow | null | undefined,
  mode: "rows" | "count" = "rows"
): TransactionQueryBuilder {
  const base =
    mode === "count"
      ? supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
      : supabase
          .from("transactions")
          .select(TRANSACTION_SELECT, { count: "exact" });

  const filtered = applyTransactionFilters(base, userId, filters, taxYear);

  if (mode === "count") {
    return filtered;
  }

  return filtered
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionWithRelations[]> {
  const supabase = await createClient();
  const taxYear = await resolveTaxYearForFilter(userId, filters.taxYearId);
  const query = buildTransactionQuery(supabase, userId, filters, taxYear);
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TransactionWithRelations[];
}

export async function getTransactionsPage(
  userId: string,
  filters: TransactionFilters = {},
  options?: { page?: number; pageSize?: number }
): Promise<PaginatedResult<TransactionWithRelations>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? TRANSACTIONS_PAGE_SIZE;
  const totalCount = await countTransactions(userId, filters);

  if (totalCount === 0) {
    return { items: [], totalCount: 0, page: 1, pageSize };
  }

  const { from, to } = paginationRange(page, pageSize, totalCount);
  const supabase = await createClient();
  const taxYear = await resolveTaxYearForFilter(userId, filters.taxYearId);
  const query = buildTransactionQuery(supabase, userId, filters, taxYear);
  const { data, error } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (data ?? []) as TransactionWithRelations[],
    totalCount,
    page,
    pageSize,
  };
}

export async function countTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<number> {
  const supabase = await createClient();
  const taxYear = await resolveTaxYearForFilter(userId, filters.taxYearId);
  const query = buildTransactionQuery(
    supabase,
    userId,
    filters,
    taxYear,
    "count"
  );
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
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

export { parsePageParam };
