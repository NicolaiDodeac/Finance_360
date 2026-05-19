import { createClient } from "@/lib/supabase/server";
import type { ServerSupabaseClient } from "@/lib/supabase/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import { DEFAULT_TAX_YEARS } from "@/lib/setup/defaults";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** Ensures UK tax years exist for the user. Safe to call repeatedly. */
export async function ensureDefaultTaxYears(
  userId: string,
  supabase?: ServerSupabaseClient
): Promise<TaxYearRow[]> {
  const client = supabase ?? (await createClient());
  const today = todayIsoDate();

  const { data: existing, error: existingError } = await client
    .from("tax_years")
    .select("label")
    .eq("user_id", userId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingLabels = new Set((existing ?? []).map((row) => row.label));

  const toInsert = DEFAULT_TAX_YEARS.filter(
    (taxYear) => !existingLabels.has(taxYear.label)
  ).map((taxYear) => ({
    user_id: userId,
    label: taxYear.label,
    start_date: taxYear.start_date,
    end_date: taxYear.end_date,
    is_current: isDateInRange(today, taxYear.start_date, taxYear.end_date),
  }));

  if (toInsert.length > 0) {
    const { error } = await client.from("tax_years").insert(toInsert);

    if (error) {
      throw new Error(error.message);
    }
  }

  const currentTaxYear = DEFAULT_TAX_YEARS.find((ty) =>
    isDateInRange(today, ty.start_date, ty.end_date)
  );

  if (currentTaxYear) {
    await client
      .from("tax_years")
      .update({ is_current: false })
      .eq("user_id", userId)
      .neq("label", currentTaxYear.label);

    await client
      .from("tax_years")
      .update({ is_current: true })
      .eq("user_id", userId)
      .eq("label", currentTaxYear.label);
  }

  const { data, error } = await client
    .from("tax_years")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
