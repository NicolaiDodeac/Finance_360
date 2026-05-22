import { createClient } from "@/lib/supabase/server";
import type { ServerSupabaseClient } from "@/lib/supabase/types";
import type { Database } from "@/types/database";

export type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];

export const CASH_MANUAL_ACCOUNT_NAME = "Cash / Manual";
export const MANUAL_ACCOUNT_NAME = "Manual Account";

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

/** Creates default accounts when the user has none yet. */
export async function ensureDefaultAccount(
  userId: string,
  supabase?: ServerSupabaseClient
): Promise<AccountRow[]> {
  const client = supabase ?? (await createClient());
  const existing = await getAccounts(userId, client);

  if (existing.length > 0) {
    return ensureCashManualAccount(userId, client);
  }

  const { error } = await client.from("accounts").insert([
    {
      user_id: userId,
      name: MANUAL_ACCOUNT_NAME,
      account_type: "other",
    },
    {
      user_id: userId,
      name: CASH_MANUAL_ACCOUNT_NAME,
      account_type: "cash",
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return getAccounts(userId, client);
}

/** Ensures the Cash / Manual account exists for receipt capture flows. */
export async function ensureCashManualAccount(
  userId: string,
  supabase?: ServerSupabaseClient
): Promise<AccountRow[]> {
  const client = supabase ?? (await createClient());
  const accounts = await getAccounts(userId, client);

  const hasCashManual = accounts.some(
    (a) =>
      a.name === CASH_MANUAL_ACCOUNT_NAME ||
      a.account_type === "cash"
  );

  if (hasCashManual) {
    return accounts;
  }

  const { error } = await client.from("accounts").insert({
    user_id: userId,
    name: CASH_MANUAL_ACCOUNT_NAME,
    account_type: "cash",
  });

  if (error) {
    throw new Error(error.message);
  }

  return getAccounts(userId, client);
}

export function findCashManualAccountId(accounts: AccountRow[]): string {
  const cash = accounts.find(
    (a) =>
      a.name === CASH_MANUAL_ACCOUNT_NAME || a.account_type === "cash"
  );
  return cash?.id ?? "";
}

export function findManualAccountId(accounts: AccountRow[]): string {
  const manual = accounts.find((a) => a.name === MANUAL_ACCOUNT_NAME);
  return manual?.id ?? accounts[0]?.id ?? "";
}

/** Accounts used when creating transactions from receipts. */
export async function ensureReceiptAccounts(
  userId: string,
  supabase?: ServerSupabaseClient
): Promise<AccountRow[]> {
  await ensureDefaultAccount(userId, supabase);
  const client = supabase ?? (await createClient());
  return ensureCashManualAccount(userId, client);
}
