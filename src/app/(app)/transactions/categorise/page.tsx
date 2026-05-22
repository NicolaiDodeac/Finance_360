import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CategorisationExplainerPanel } from "@/components/categorization/categorisation-explainer-panel";
import { CategoriseAssistantView } from "@/components/categorization/categorise-assistant-view";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/helpers";
import { getCategories } from "@/lib/categories/queries";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { getCategorizationRules } from "@/lib/categorization/queries";
import {
  getCategorisedTransactionsForMemory,
  getReviewDeferredTransactionCount,
  getUncategorisedTransactionsForAssistant,
} from "@/lib/categorization/assistant-queries";
import { buildMerchantGroups } from "@/lib/categorization/groups";
import { buildMerchantMemoryIndex } from "@/lib/categorization/merchant-memory-index";
import { getHmrcCategories } from "@/lib/hmrc/queries";

export default async function CategoriseTransactionsPage() {
  const user = await requireAuth();

  await ensureDefaultCategories(user.id);

  const [transactions, categories, hmrcCategories, rules, reviewDeferredCount, memoryRows] =
    await Promise.all([
      getUncategorisedTransactionsForAssistant(user.id),
      getCategories(user.id),
      getHmrcCategories(),
      getCategorizationRules(user.id, { activeOnly: true }),
      getReviewDeferredTransactionCount(user.id),
      getCategorisedTransactionsForMemory(user.id),
    ]);

  const memoryIndex = buildMerchantMemoryIndex(memoryRows);
  const groups = buildMerchantGroups(
    transactions,
    categories,
    rules,
    memoryIndex
  );

  return (
    <>
      <div className="mb-4">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/transactions">
            <ArrowLeft className="h-4 w-4" />
            Back to transactions
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Business categorisation assistant"
        description="Income by type, expenses by purpose. Finance 360 maps categories and tax behind the scenes — you review before anything is saved."
      />
      <div className="mb-6">
        <CategorisationExplainerPanel />
      </div>
      <CategoriseAssistantView
        initialGroups={groups}
        categories={categories}
        hmrcCategories={hmrcCategories}
        reviewDeferredCount={reviewDeferredCount}
      />
    </>
  );
}
