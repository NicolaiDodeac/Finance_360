import { createClient } from "@/lib/supabase/server";
import { getTaxYears } from "@/lib/tax-years/queries";
import { computeTaxHubSummary } from "@/lib/tax/calculations";
import { resolveSelectedTaxYear } from "@/lib/tax/tax-year";
import type { TaxHubData, TaxTransactionRow } from "@/lib/tax/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";

const TAX_TRANSACTION_SELECT = `
  id,
  amount,
  direction,
  is_business,
  category_id,
  hmrc_category_id,
  receipt_id,
  transaction_date,
  description,
  merchant_name,
  notes,
  account_id,
  hmrc_category:hmrc_categories(id, code, name, is_allowable_expense)
`;

export async function getTaxYearBusinessTransactions(
  userId: string,
  taxYear: TaxYearRow
): Promise<TaxTransactionRow[]> {
  const supabase = await createClient();

  const query = supabase
    .from("transactions")
    .select(TAX_TRANSACTION_SELECT)
    .eq("user_id", userId)
    .eq("is_business", true)
    .or(
      `tax_year_id.eq.${taxYear.id},and(tax_year_id.is.null,transaction_date.gte.${taxYear.start_date},transaction_date.lte.${taxYear.end_date})`
    );

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TaxTransactionRow[];
}

export async function getTaxHubData(
  userId: string,
  taxYearId?: string
): Promise<TaxHubData> {
  const taxYears = await getTaxYears(userId);
  const selectedTaxYear = resolveSelectedTaxYear(taxYears, taxYearId);

  if (!selectedTaxYear) {
    return {
      taxYears,
      selectedTaxYear: null,
      summary: null,
    };
  }

  const transactions = await getTaxYearBusinessTransactions(
    userId,
    selectedTaxYear
  );

  return {
    taxYears,
    selectedTaxYear,
    summary: computeTaxHubSummary(selectedTaxYear.id, transactions),
  };
}
