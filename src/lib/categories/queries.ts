import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export async function getCategories(userId: string): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
