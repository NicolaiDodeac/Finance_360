import type { AccountRow } from "@/lib/accounts/queries";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { ReceiptRow } from "@/lib/receipts/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import type {
  Database,
  TransactionDirection,
} from "@/types/database";

export type { TransactionDirection };

export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export interface TransactionWithRelations extends TransactionRow {
  account: Pick<AccountRow, "id" | "name"> | null;
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  hmrc_category: Pick<HmrcCategoryRow, "id" | "code" | "name"> | null;
  tax_year: Pick<TaxYearRow, "id" | "label"> | null;
  receipt: Pick<
    ReceiptRow,
    "id" | "original_filename" | "merchant_name" | "mime_type"
  > | null;
}

export type BusinessScopeFilter = "all" | "business" | "personal";

export interface TransactionFilters {
  search?: string;
  direction?: TransactionDirection | "all";
  scope?: BusinessScopeFilter;
  categoryId?: string;
  taxYearId?: string;
  hmrcCategoryIds?: string[];
  /** Inclusive lower bound (YYYY-MM-DD). */
  from?: string;
  /** Inclusive upper bound (YYYY-MM-DD). */
  to?: string;
}

export interface TransactionFormInput {
  account_id: string;
  transaction_date: string;
  description: string;
  merchant_name: string;
  amount: number;
  direction: TransactionDirection;
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean;
  business_use_percent: number | null;
  notes: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}
