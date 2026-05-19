import { getAccounts } from "@/lib/accounts/queries";
import { getCategories } from "@/lib/categories/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import { getTaxYears } from "@/lib/tax-years/queries";
import {
  REQUIRED_CATEGORY_SLUGS,
  REQUIRED_TAX_YEAR_LABELS,
} from "@/lib/setup/defaults";

export interface SetupStatus {
  defaultAccountExists: boolean;
  categoriesInitialized: boolean;
  taxYearsInitialized: boolean;
  hmrcCategoriesAvailable: boolean;
  categoryCount: number;
  taxYearCount: number;
  hmrcCategoryCount: number;
}

export async function getSetupStatus(userId: string): Promise<SetupStatus> {
  const [accounts, categories, taxYears, hmrcCategories] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
    getTaxYears(userId),
    getHmrcCategories(),
  ]);

  const categorySlugs = new Set(categories.map((c) => c.slug));
  const taxYearLabels = new Set(taxYears.map((ty) => ty.label));

  const categoriesInitialized = REQUIRED_CATEGORY_SLUGS.every((slug) =>
    categorySlugs.has(slug)
  );

  const taxYearsInitialized = REQUIRED_TAX_YEAR_LABELS.every((label) =>
    taxYearLabels.has(label)
  );

  return {
    defaultAccountExists: accounts.length > 0,
    categoriesInitialized,
    taxYearsInitialized,
    hmrcCategoriesAvailable: hmrcCategories.length > 0,
    categoryCount: categories.length,
    taxYearCount: taxYears.length,
    hmrcCategoryCount: hmrcCategories.length,
  };
}
