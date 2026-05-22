"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/helpers";
import {
  filterRowsForImport,
  markImportPreviewRows,
} from "@/lib/import/dedupe";
import {
  applyRulesToImportRow,
  collectMatchedRuleIds,
} from "@/lib/categorization/apply-batch";
import { incrementRulesTimesMatched } from "@/lib/categorization/increment";
import { getCategorizationRules } from "@/lib/categorization/queries";
import { getCategories } from "@/lib/categories/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import { buildImportPreviewGroups } from "@/lib/import/preview-groups";
import type { ImportPreviewMerchantGroup } from "@/lib/import/preview-groups";
import { parseImportFile } from "@/lib/import/parse";
import { getExistingTransactionsForImport } from "@/lib/import/queries";
import type {
  ImportPreviewRow,
  ImportTransactionsInput,
  ImportTransactionsResult,
  ParseImportFileResult,
} from "@/lib/import/types";
import { createClient } from "@/lib/supabase/server";
import { findTaxYearForDate, getTaxYears } from "@/lib/tax-years/queries";
import type { ActionResult } from "@/lib/transactions/types";

export interface ParseImportPreviewResult extends ParseImportFileResult {
  preview_rows: ImportPreviewRow[];
  preview_groups: ImportPreviewMerchantGroup[];
  uncategorised_new_count: number;
  account_id: string;
  hmrc_categories: Awaited<ReturnType<typeof getHmrcCategories>>;
}

export async function parseImportPreview(
  formData: FormData
): Promise<ActionResult<ParseImportPreviewResult>> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Please sign in again to import statements." };
  }

  const accountId = String(formData.get("account_id") ?? "");
  const file = formData.get("file");

  if (!accountId) {
    return { success: false, error: "Please select an account." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose a PDF or CSV file." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseImportFile(file.name, buffer, file.type);
    const [rules, categories, hmrcCategories] = await Promise.all([
      getCategorizationRules(user.id, { activeOnly: true }),
      getCategories(user.id),
      getHmrcCategories(),
    ]);

    const categorizedTransactions = parsed.transactions.map((tx) => {
      const fields = applyRulesToImportRow(
        {
          description: tx.description,
          merchant_name: tx.merchant_name,
        },
        rules,
        tx.raw_import_data,
        { direction: tx.direction, categories, hmrcCategories }
      );

      return {
        ...tx,
        category_id: fields.category_id,
        hmrc_category_id: fields.hmrc_category_id,
        is_business: fields.is_business,
        raw_import_data: fields.raw_import_data,
        matched_rule_id: fields.matched_rule_id,
        matched_rule_name: fields.matched_rule_name,
      };
    });

    if (categorizedTransactions.length === 0) {
      return {
        success: false,
        error:
          parsed.warnings[0] ??
          "No transactions could be extracted from this file.",
      };
    }

    const dates = categorizedTransactions.map((tx) => tx.date).sort();
    const dateFrom = dates[0];
    const dateTo = dates[dates.length - 1];

    const existing = await getExistingTransactionsForImport(
      user.id,
      accountId,
      dateFrom,
      dateTo
    );

    const preview_rows = markImportPreviewRows(
      categorizedTransactions,
      existing,
      accountId
    );

    const newRows = preview_rows.filter((r) => r.status === "new");
    const uncategorised_new_count = newRows.filter((r) => !r.category_id).length;
    const preview_groups = buildImportPreviewGroups(
      preview_rows,
      categories,
      rules
    );

    return {
      success: true,
      data: {
        ...parsed,
        transactions: categorizedTransactions,
        preview_rows,
        preview_groups,
        uncategorised_new_count,
        account_id: accountId,
        hmrc_categories: hmrcCategories,
      },
    };
  } catch (err) {
    console.error("[parseImportPreview]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to parse file.",
    };
  }
}

export async function importTransactions(
  input: ImportTransactionsInput
): Promise<ActionResult<ImportTransactionsResult>> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Please sign in again to import statements." };
  }

  if (!input.account_id) {
    return { success: false, error: "Account is required." };
  }

  if (!input.rows.length) {
    return { success: false, error: "No transactions selected for import." };
  }

  const previewRows: ImportPreviewRow[] = input.rows.map((row, index) => ({
    ...row,
    preview_id: `import-${index}`,
    status: "new" as const,
  }));

  const dates = input.rows.map((r) => r.date).sort();
  const existing = await getExistingTransactionsForImport(
    user.id,
    input.account_id,
    dates[0],
    dates[dates.length - 1]
  );

  const marked = markImportPreviewRows(previewRows, existing, input.account_id);
  const toInsert = filterRowsForImport(marked);

  if (toInsert.length === 0) {
    return {
      success: true,
      data: {
        imported: 0,
        skipped_duplicates: input.rows.length,
        skipped_invalid: 0,
      },
    };
  }

  const [rules, categories] = await Promise.all([
    getCategorizationRules(user.id, { activeOnly: true }),
    getCategories(user.id),
  ]);
  const taxYears = await getTaxYears(user.id);
  const supabase = await createClient();

  const categorizedRows = toInsert.map((row) => {
    const fields = applyRulesToImportRow(
      {
        description: row.description,
        merchant_name: row.merchant_name,
      },
      rules,
      {
        ...row.raw_import_data,
        import_adapter: input.adapter_id,
        import_file: input.file_name,
        import_key: row.import_key,
        imported_at: new Date().toISOString(),
      },
      { direction: row.direction, categories }
    );

    return {
      row,
      fields,
    };
  });

  const payloads = categorizedRows.map(({ row, fields }) => ({
    user_id: user.id,
    account_id: input.account_id,
    transaction_date: row.date,
    description: row.description,
    merchant_name: row.merchant_name,
    amount: row.amount,
    direction: row.direction,
    category_id: row.category_id ?? fields.category_id,
    hmrc_category_id: row.hmrc_category_id ?? fields.hmrc_category_id,
    is_business: row.is_business ?? fields.is_business,
    business_use_percent: null,
    notes: null,
    tax_year_id: findTaxYearForDate(taxYears, row.date)?.id ?? null,
    raw_import_data: fields.raw_import_data as Record<string, unknown>,
  }));

  const { error } = await supabase.from("transactions").insert(payloads);

  if (error) {
    return { success: false, error: error.message };
  }

  const matchedRuleIds = collectMatchedRuleIds(
    categorizedRows.map(({ fields }) => ({
      matched_rule_id: fields.matched_rule_id,
    }))
  );
  await incrementRulesTimesMatched(user.id, matchedRuleIds);

  revalidatePath("/transactions");
  revalidatePath("/transactions/import");
  revalidatePath("/transactions/categorise");
  revalidatePath("/dashboard");

  return {
    success: true,
    data: {
      imported: toInsert.length,
      skipped_duplicates: input.rows.length - toInsert.length,
      skipped_invalid: 0,
    },
  };
}
