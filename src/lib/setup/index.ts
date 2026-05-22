import {
  ensureCashManualAccount,
  ensureDefaultAccount,
} from "@/lib/accounts/queries";
import { ensurePersonalSpace } from "@/lib/spaces/queries";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { getSetupStatus, type SetupStatus } from "@/lib/setup/status";
import { ensureDefaultTaxYears } from "@/lib/setup/tax-years";

export type { SetupStatus } from "@/lib/setup/status";
export {
  DEFAULT_CATEGORY_CHILDREN,
  DEFAULT_CATEGORY_PARENTS,
  DEFAULT_TAX_YEARS,
} from "@/lib/setup/defaults";

export interface UserSetupResult {
  status: SetupStatus;
}

/**
 * Idempotent first-run setup for authenticated users.
 * Creates default account, categories, and tax years when missing.
 */
export async function ensureUserSetup(userId: string): Promise<UserSetupResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized");
  }

  // Sequential setup with one session avoids parallel cookie/client races.
  await ensurePersonalSpace(userId);
  await ensureDefaultAccount(userId, supabase);
  await ensureCashManualAccount(userId, supabase);
  await ensureDefaultCategories(userId, supabase);
  await ensureDefaultTaxYears(userId, supabase);

  const status = await getSetupStatus(userId);
  return { status };
}

export { getSetupStatus };
export { ensureDefaultCategories } from "@/lib/setup/categories";
