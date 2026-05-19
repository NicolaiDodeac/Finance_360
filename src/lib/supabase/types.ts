import type { createClient } from "@/lib/supabase/server";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;
