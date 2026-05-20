import { createClient } from "@/lib/supabase/server";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import { computeSelfAssessmentPrepSummaryWithRules } from "@/lib/self-assessment/calculations";
import type { SaPrepData } from "@/lib/self-assessment/types";
import { getTaxYears } from "@/lib/tax-years/queries";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import {
  getTaxYearBusinessTransactions,
} from "@/lib/tax/queries";
import { resolveSelectedTaxYear } from "@/lib/tax/tax-year";
import type { TaxTransactionRow } from "@/lib/tax/types";

const TAX_YEAR_INCOME_SELECT = `
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
  raw_import_data,
  hmrc_category:hmrc_categories(id, code, name, is_allowable_expense)
`;

async function getTaxYearNonBusinessIncome(
  userId: string,
  taxYear: TaxYearRow
): Promise<TaxTransactionRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(TAX_YEAR_INCOME_SELECT)
    .eq("user_id", userId)
    .eq("is_business", false)
    .eq("direction", "income")
    .or(
      `tax_year_id.eq.${taxYear.id},and(tax_year_id.is.null,transaction_date.gte.${taxYear.start_date},transaction_date.lte.${taxYear.end_date})`
    );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TaxTransactionRow[];
}

export async function getSelfAssessmentPrepData(
  userId: string,
  taxYearId?: string
): Promise<SaPrepData> {
  const taxYears = await getTaxYears(userId);
  const selectedTaxYear = resolveSelectedTaxYear(taxYears, taxYearId);

  if (!selectedTaxYear) {
    return {
      taxYears,
      selectedTaxYear: null,
      summary: null,
    };
  }

  const [businessTransactions, incomeCandidates, hmrcCategories] =
    await Promise.all([
      getTaxYearBusinessTransactions(userId, selectedTaxYear),
      getTaxYearNonBusinessIncome(userId, selectedTaxYear),
      getHmrcCategories(),
    ]);

  const summary = await computeSelfAssessmentPrepSummaryWithRules(userId, {
    taxYearId: selectedTaxYear.id,
    businessTransactions,
    taxYearIncomeCandidates: incomeCandidates,
    hmrcCategories: hmrcCategories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      is_allowable_expense: c.is_allowable_expense,
    })),
  });

  return {
    taxYears,
    selectedTaxYear,
    summary,
  };
}
