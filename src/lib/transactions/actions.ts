"use server";

import { revalidatePath } from "next/cache";
import {
  applyCategorizationRules,
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
import { incrementRulesTimesMatched } from "@/lib/categorization/increment";
import { getCategorizationRules } from "@/lib/categorization/queries";
import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import {
  findTaxYearForDate,
  getTaxYears,
} from "@/lib/tax-years/queries";
import type {
  ActionResult,
  TransactionFormInput,
} from "@/lib/transactions/types";

function parseFormInput(raw: TransactionFormInput): {
  input: TransactionFormInput;
  error?: string;
} {
  if (!raw.account_id) {
    return { input: raw, error: "Please select an account." };
  }
  if (!raw.transaction_date) {
    return { input: raw, error: "Please enter a date." };
  }
  if (!Number.isFinite(raw.amount) || raw.amount < 0) {
    return { input: raw, error: "Amount must be zero or greater." };
  }
  if (
    raw.is_business &&
    raw.business_use_percent !== null &&
    (raw.business_use_percent < 0 || raw.business_use_percent > 100)
  ) {
    return {
      input: raw,
      error: "Business use must be between 0 and 100 percent.",
    };
  }

  return { input: raw };
}

function toInsertPayload(
  userId: string,
  input: TransactionFormInput,
  taxYearId: string | null,
  rawImportData: Record<string, unknown> | null
) {
  return {
    user_id: userId,
    account_id: input.account_id,
    transaction_date: input.transaction_date,
    description: input.description.trim() || null,
    merchant_name: input.merchant_name.trim() || null,
    amount: input.amount,
    direction: input.direction,
    category_id: input.category_id || null,
    hmrc_category_id: input.hmrc_category_id || null,
    is_business: input.is_business,
    business_use_percent: input.is_business ? input.business_use_percent : null,
    notes: input.notes.trim() || null,
    tax_year_id: taxYearId,
    raw_import_data: rawImportData,
  };
}

function toUpdatePayload(
  input: TransactionFormInput,
  taxYearId: string | null,
  rawImportData: Record<string, unknown> | null
) {
  return {
    account_id: input.account_id,
    transaction_date: input.transaction_date,
    description: input.description.trim() || null,
    merchant_name: input.merchant_name.trim() || null,
    amount: input.amount,
    direction: input.direction,
    category_id: input.category_id || null,
    hmrc_category_id: input.hmrc_category_id || null,
    is_business: input.is_business,
    business_use_percent: input.is_business ? input.business_use_percent : null,
    notes: input.notes.trim() || null,
    tax_year_id: taxYearId,
    raw_import_data: rawImportData,
  };
}

export async function createTransaction(
  raw: TransactionFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();
  const { input: parsed, error: validationError } = parseFormInput(raw);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const rules = await getCategorizationRules(user.id, { activeOnly: true });
  const applied = applyCategorizationRules(
    {
      description: parsed.description.trim() || null,
      merchant_name: parsed.merchant_name.trim() || null,
    },
    rules,
    {
      onlyFillEmpty: true,
      existing: {
        category_id: parsed.category_id,
        hmrc_category_id: parsed.hmrc_category_id,
        is_business: parsed.is_business,
      },
    }
  );

  const categorizedInput: TransactionFormInput = {
    ...parsed,
    category_id: applied.category_id,
    hmrc_category_id: applied.hmrc_category_id,
    is_business: applied.is_business ?? parsed.is_business,
  };

  const rawImportData = applied.matched_rule
    ? mergeRawImportCategorization(
        null,
        buildCategorizationMetadata(applied.matched_rule)
      )
    : null;

  const taxYears = await getTaxYears(user.id);
  const taxYearId =
    findTaxYearForDate(taxYears, categorizedInput.transaction_date)?.id ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert(
      toInsertPayload(user.id, categorizedInput, taxYearId, rawImportData)
    )
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (applied.matched_rule) {
    await incrementRulesTimesMatched(user.id, [applied.matched_rule.id]);
  }

  revalidatePath("/transactions");
  return { success: true, data: { id: data.id } };
}

export async function updateTransaction(
  transactionId: string,
  raw: TransactionFormInput
): Promise<ActionResult> {
  const user = await requireAuth();
  const { input: parsed, error: validationError } = parseFormInput(raw);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select(
      "description, merchant_name, raw_import_data"
    )
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Transaction not found." };
  }

  const descriptionChanged =
    (parsed.description.trim() || null) !== (existing.description ?? null);
  const merchantChanged =
    (parsed.merchant_name.trim() || null) !== (existing.merchant_name ?? null);

  let categorizedInput = parsed;
  let matchedRuleId: string | null = null;
  const existingRaw =
    (existing.raw_import_data as Record<string, unknown> | null) ?? null;
  let rawImportData = existingRaw;

  if (descriptionChanged || merchantChanged) {
    const rules = await getCategorizationRules(user.id, { activeOnly: true });
    const applied = applyCategorizationRules(
      {
        description: parsed.description.trim() || null,
        merchant_name: parsed.merchant_name.trim() || null,
      },
      rules,
      {
        onlyFillEmpty: true,
        existing: {
          category_id: parsed.category_id,
          hmrc_category_id: parsed.hmrc_category_id,
          is_business: parsed.is_business,
        },
      }
    );

    categorizedInput = {
      ...parsed,
      category_id: applied.category_id,
      hmrc_category_id: applied.hmrc_category_id,
      is_business: applied.is_business ?? parsed.is_business,
    };
    matchedRuleId = applied.matched_rule?.id ?? null;

    rawImportData = applied.matched_rule
      ? mergeRawImportCategorization(
          existingRaw,
          buildCategorizationMetadata(applied.matched_rule)
        )
      : existingRaw;
  }

  const taxYears = await getTaxYears(user.id);
  const taxYearId =
    findTaxYearForDate(taxYears, categorizedInput.transaction_date)?.id ?? null;

  const { error } = await supabase
    .from("transactions")
    .update(toUpdatePayload(categorizedInput, taxYearId, rawImportData))
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  if (matchedRuleId) {
    await incrementRulesTimesMatched(user.id, [matchedRuleId]);
  }

  revalidatePath("/transactions");
  return { success: true };
}
