import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/profile/types";

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProfileRow | null) ?? null;
}

/** Ensures a profile row exists (signup trigger may have created it). */
export async function ensureProfile(userId: string): Promise<ProfileRow> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, user_id: userId })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProfileRow;
}
