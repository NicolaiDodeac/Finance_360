import { parseIsoDateParam } from "@/lib/transactions/date-range";
import type {
  BusinessScopeFilter,
  TransactionFilters,
} from "@/lib/transactions/types";
import type { TransactionDirection } from "@/types/database";

export interface TransactionSearchParams {
  q?: string;
  direction?: string;
  scope?: string;
  category?: string;
  taxYear?: string;
  hmrc?: string;
  from?: string;
  to?: string;
}

export function parseTransactionSearchParams(
  params: TransactionSearchParams
): TransactionFilters {
  const direction = params.direction;
  const scope = params.scope;

  return {
    search: params.q,
    direction:
      direction === "income" ||
      direction === "expense" ||
      direction === "transfer"
        ? (direction as TransactionDirection)
        : "all",
    scope:
      scope === "business" || scope === "personal"
        ? (scope as BusinessScopeFilter)
        : "all",
    categoryId: params.category,
    taxYearId: params.taxYear,
    hmrcCategoryIds: params.hmrc
      ? params.hmrc.split(",").filter(Boolean)
      : undefined,
    from: parseIsoDateParam(params.from),
    to: parseIsoDateParam(params.to),
  };
}
