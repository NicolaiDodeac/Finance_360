import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RulesManager } from "@/components/rules/rules-manager";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/helpers";
import { getCategories } from "@/lib/categories/queries";
import { getCategorizationRules } from "@/lib/categorization/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";

export default async function CategorizationRulesPage() {
  const user = await requireAuth();

  const [rules, categories, hmrcCategories] = await Promise.all([
    getCategorizationRules(user.id),
    getCategories(user.id),
    getHmrcCategories(),
  ]);

  return (
    <>
      <div className="mb-4">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
            Back to settings
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Categorisation rules"
        description="Teach Finance 360 how to label recurring merchants. Rules run before AI — your corrections become automatic."
      />
      <RulesManager
        rules={rules}
        categories={categories}
        hmrcCategories={hmrcCategories}
      />
    </>
  );
}
