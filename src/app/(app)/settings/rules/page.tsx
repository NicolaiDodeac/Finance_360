import { PageHeader } from "@/components/shared/page-header";
import { RulesManager } from "@/components/rules/rules-manager";
import { requireAuth } from "@/lib/auth/helpers";
import { getCategories } from "@/lib/categories/queries";
import { getCategorizationRules } from "@/lib/categorization/queries";
import { dryRunRuleRepairForUser } from "@/lib/categorization/rule-repair";
import { getHmrcCategories } from "@/lib/hmrc/queries";

export default async function CategorizationRulesPage() {
  const user = await requireAuth();

  const [rules, categories, hmrcCategories, repairPreview] = await Promise.all([
    getCategorizationRules(user.id),
    getCategories(user.id),
    getHmrcCategories(),
    dryRunRuleRepairForUser(user.id),
  ]);

  return (
    <>
      <PageHeader
        backHref="/settings"
        backLabel="Back to settings"
        title="Categorisation rules"
        description="Teach Finance 360 how to label recurring merchants. Rules run before AI — your corrections become automatic."
      />
      <RulesManager
        rules={rules}
        categories={categories}
        hmrcCategories={hmrcCategories}
        repairableRuleCount={repairPreview.repairableCount}
      />
    </>
  );
}
