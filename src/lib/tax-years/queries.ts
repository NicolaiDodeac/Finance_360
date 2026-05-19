import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type TaxYearRow = Database["public"]["Tables"]["tax_years"]["Row"];

export async function getTaxYears(userId: string): Promise<TaxYearRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tax_years")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export function findTaxYearForDate(
  taxYears: TaxYearRow[],
  date: string
): TaxYearRow | undefined {
  return taxYears.find(
    (ty) => date >= ty.start_date && date <= ty.end_date
  );
}
