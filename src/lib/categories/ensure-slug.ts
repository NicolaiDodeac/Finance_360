import type { CategoryRow } from "@/lib/categories/queries";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { getDefaultCategoryChildBySlug } from "@/lib/setup/defaults";
import { createClient } from "@/lib/supabase/server";
import type { ServerSupabaseClient } from "@/lib/supabase/types";

/**
 * Ensures a default category exists for the user (runs full default sync first).
 * Safe to call before categorisation apply when the slug may be missing.
 */
export async function ensureCategoryBySlug(
  userId: string,
  slug: string,
  supabase?: ServerSupabaseClient
): Promise<CategoryRow | null> {
  if (!getDefaultCategoryChildBySlug(slug)) {
    return null;
  }

  const client = supabase ?? (await createClient());
  await ensureDefaultCategories(userId, client);

  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}
