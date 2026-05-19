import { createClient } from "@/lib/supabase/server";
import type { ServerSupabaseClient } from "@/lib/supabase/types";
import type { Database } from "@/types/database";

export type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];

export async function getAccounts(
  userId: string,
  supabase?: ServerSupabaseClient
): Promise<AccountRow[]> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/** Creates "Manual Account" when the user has no accounts yet. */
export async function ensureDefaultAccount(
  userId: string,
  supabase?: ServerSupabaseClient
): Promise<AccountRow[]> {
  const client = supabase ?? (await createClient());
  const existing = await getAccounts(userId, client);

  if (existing.length > 0) {
    return existing;
  }

  const { data, error } = await client
    .from("accounts")
    .insert({
      user_id: userId,
      name: "Manual Account",
      account_type: "other",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return [data];
}
