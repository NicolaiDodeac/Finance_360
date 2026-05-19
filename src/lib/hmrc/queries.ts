import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type HmrcCategoryRow = Database["public"]["Tables"]["hmrc_categories"]["Row"];

export async function getHmrcCategories(): Promise<HmrcCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hmrc_categories")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
