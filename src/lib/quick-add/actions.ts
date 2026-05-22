"use server";

import { revalidatePath } from "next/cache";
import {
  applyCategorizationRules,
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
import { mergeAssistantMetadata } from "@/lib/categorization/assistant-metadata";
import { incrementRulesTimesMatched } from "@/lib/categorization/increment";
import { getCategorizationRules } from "@/lib/categorization/queries";
import { collectMatchedRuleIds } from "@/lib/categorization/apply-batch";
import { draftToAssistantPatch } from "@/lib/quick-add/resolve-draft";
import type { QuickAddSaveInput } from "@/lib/quick-add/types";
import { ensureDefaultAccount } from "@/lib/accounts/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { findTaxYearForDate, getTaxYears } from "@/lib/tax-years/queries";
import type { ActionResult } from "@/lib/transactions/types";

function findManualAccountId(
  accounts: Awaited<ReturnType<typeof ensureDefaultAccount>>
): string {
  const manual = accounts.find((a) => a.name === "Manual Account");
  return manual?.id ?? accounts[0]?.id ?? "";
}

export async function saveQuickAddDrafts(
  input: QuickAddSaveInput
): Promise<ActionResult<{ created: number }>> {
  const user = await requireAuth();

  if (!input.drafts.length) {
    return { success: false, error: "Add at least one draft to save." };
  }

  for (const draft of input.drafts) {
    if (!draft.transaction_date) {
      return { success: false, error: "Each draft needs a date." };
    }
    if (!Number.isFinite(draft.amount) || draft.amount <= 0) {
      return {
        success: false,
        error: `Enter a valid amount for ${draft.merchant_name || "a draft"}.`,
      };
    }
  }

  const [accounts, , rules, taxYears, hmrcCategories] = await Promise.all([
    ensureDefaultAccount(user.id),
    ensureDefaultCategories(user.id),
    getCategorizationRules(user.id, { activeOnly: true }),
    getTaxYears(user.id),
    getHmrcCategories(),
  ]);

  const accountId = findManualAccountId(accounts);
  if (!accountId) {
    return { success: false, error: "No account available. Try again shortly." };
  }

  const supabase = await createClient();
  const ruleMatches: Array<{ matched_rule_id: string | null }> = [];

  const payloads = input.drafts.map((draft) => {
    const applied = applyCategorizationRules(
      {
        description: draft.description.trim() || null,
        merchant_name: draft.merchant_name.trim() || null,
      },
      rules,
      {
        onlyFillEmpty: true,
        existing: {
          category_id: draft.category_id,
          hmrc_category_id: draft.hmrc_category_id,
          is_business: draft.is_business,
        },
      }
    );

    ruleMatches.push({ matched_rule_id: applied.matched_rule?.id ?? null });

    let raw: Record<string, unknown> = {
      source: "quick_add",
      original_text: input.original_text.trim(),
      segment: draft.original_segment,
    };

    const assistantPatch = {
      ...draftToAssistantPatch({
        id: "",
        originalSegment: draft.original_segment,
        transaction_date: draft.transaction_date,
        merchant_name: draft.merchant_name,
        description: draft.description,
        amount: draft.amount,
        direction: draft.direction,
        purpose: draft.purpose,
        categoryChoiceId: draft.category_choice,
        categoryId: applied.category_id ?? draft.category_id,
        categoryName: null,
        hmrcCategoryId: applied.hmrc_category_id ?? draft.hmrc_category_id,
        hmrcCategoryName: null,
        hmrcCategoryCode: null,
        flowType: draft.flow_type,
        isBusiness: applied.is_business ?? draft.is_business,
        countsAsTurnover: draft.counts_as_turnover,
        excludeFromIncome: draft.exclude_from_income,
        excludeFromSpending: draft.exclude_from_spending,
        confidence: draft.review_recommended ? "review_recommended" : "high",
        reviewRecommended: draft.review_recommended,
      }),
      review_recommended: draft.review_recommended,
      flow_type: draft.flow_type ?? undefined,
      category_choice: draft.category_choice ?? undefined,
      counts_as_turnover: draft.counts_as_turnover,
      exclude_from_income: draft.exclude_from_income,
      exclude_from_spending: draft.exclude_from_spending,
    };

    if (draft.hmrc_category_id && hmrcCategories.length) {
      const hmrc = hmrcCategories.find((h) => h.id === draft.hmrc_category_id);
      if (hmrc?.code) {
        assistantPatch.hmrc_category_code = hmrc.code;
      }
    }

    raw = mergeAssistantMetadata(raw, assistantPatch);

    if (applied.matched_rule) {
      raw = mergeRawImportCategorization(
        raw,
        buildCategorizationMetadata(applied.matched_rule)
      );
    }

    const taxYearId =
      findTaxYearForDate(taxYears, draft.transaction_date)?.id ?? null;

    return {
      user_id: user.id,
      account_id: accountId,
      transaction_date: draft.transaction_date,
      description: draft.description.trim() || null,
      merchant_name: draft.merchant_name.trim() || null,
      amount: draft.amount,
      direction: draft.direction,
      category_id: applied.category_id ?? draft.category_id,
      hmrc_category_id: applied.hmrc_category_id ?? draft.hmrc_category_id,
      is_business: applied.is_business ?? draft.is_business,
      business_use_percent: (applied.is_business ?? draft.is_business) ? 100 : null,
      notes: null,
      tax_year_id: taxYearId,
      raw_import_data: raw,
    };
  });

  const { error } = await supabase.from("transactions").insert(payloads);

  if (error) {
    return { success: false, error: error.message };
  }

  await incrementRulesTimesMatched(user.id, collectMatchedRuleIds(ruleMatches));

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/transactions/categorise");

  return { success: true, data: { created: payloads.length } };
}
