import { requireAuth } from "@/lib/auth/helpers";
import { ensureProfile } from "@/lib/profile/queries";
import { getActiveSpaceContext, getUserSpaces } from "@/lib/spaces/queries";
import { ensureUserSetup } from "@/lib/setup";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories, type CategoryRow } from "@/lib/categories/queries";
import { getHmrcCategories, type HmrcCategoryRow } from "@/lib/hmrc/queries";
import { getTaxYears } from "@/lib/tax-years/queries";
import { resolveDefaultTaxYear } from "@/lib/tax/tax-year";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  try {
    await ensureUserSetup(user.id);
  } catch (err) {
    console.error("[ensureUserSetup]", err);
  }

  const profile = await ensureProfile(user.id);
  const [spaces, { space: activeSpace }] = await Promise.all([
    getUserSpaces(user.id),
    getActiveSpaceContext(user.id),
  ]);

  let captureCategories: CategoryRow[] = [];
  let captureHmrcCategories: HmrcCategoryRow[] = [];
  let captureDefaultTaxYearId: string | null = null;
  try {
    const [categories, hmrcCategories, taxYears] = await Promise.all([
      getCategories(user.id),
      getHmrcCategories(),
      getTaxYears(user.id),
    ]);
    captureCategories = categories;
    captureHmrcCategories = hmrcCategories;
    captureDefaultTaxYearId = resolveDefaultTaxYear(taxYears)?.id ?? null;
  } catch (err) {
    console.error("[captureData]", err);
  }

  return (
    <AppShell
      userEmail={user.email}
      financeMode={profile.finance_mode}
      spaces={spaces}
      activeSpaceId={activeSpace.id}
      captureCategories={captureCategories}
      captureHmrcCategories={captureHmrcCategories}
      captureDefaultTaxYearId={captureDefaultTaxYearId}
    >
      {children}
    </AppShell>
  );
}
