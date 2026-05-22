"use server";

import { revalidatePath } from "next/cache";
import {
  applyCategorizationRules,
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
import { incrementRulesTimesMatched } from "@/lib/categorization/increment";
import { getCategorizationRules } from "@/lib/categorization/queries";
import {
  ensureReceiptAccounts,
  findCashManualAccountId,
  findManualAccountId,
} from "@/lib/accounts/queries";
import { requireAuth } from "@/lib/auth/helpers";
import {
  MAX_RECEIPT_FILE_BYTES,
  RECEIPTS_BUCKET,
} from "@/lib/receipts/constants";
import {
  extractionToOcrData,
  extractReceiptFromBuffer,
} from "@/lib/receipts/ocr/extract";
import type { ReceiptOcrExtraction } from "@/lib/receipts/ocr/types";
import { rankTransactionMatches } from "@/lib/receipts/match";
import {
  getMatchableTransactions,
  getReceiptById,
} from "@/lib/receipts/queries";
import {
  buildReceiptStoragePath,
  guessMimeType,
  isAllowedReceiptFile,
} from "@/lib/receipts/storage";
import type {
  ActionResult,
  CreateTransactionFromReceiptInput,
  ReceiptCaptureReviewData,
  ReceiptTransactionKind,
} from "@/lib/receipts/types";
import { attachReceiptToTransaction } from "@/lib/receipts/actions";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { findTaxYearForDate, getTaxYears } from "@/lib/tax-years/queries";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { TransactionDirection } from "@/types/database";

const REVALIDATE_PATHS = [
  "/receipts",
  "/receipts/review",
  "/transactions",
  "/tax",
  "/dashboard",
] as const;

function revalidateCapturePaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

function kindToTransactionDefaults(
  kind: ReceiptTransactionKind,
  accounts: Awaited<ReturnType<typeof ensureReceiptAccounts>>
): { direction: TransactionDirection; accountId: string; isBusiness: boolean } {
  const cashId = findCashManualAccountId(accounts);
  const manualId = findManualAccountId(accounts);

  switch (kind) {
    case "cash_expense":
      return {
        direction: "expense",
        accountId: cashId || manualId,
        isBusiness: false,
      };
    case "card_manual_expense":
      return {
        direction: "expense",
        accountId: manualId || cashId,
        isBusiness: false,
      };
    case "cash_income":
      return {
        direction: "income",
        accountId: cashId || manualId,
        isBusiness: false,
      };
    case "business_income":
      return {
        direction: "income",
        accountId: manualId || cashId,
        isBusiness: true,
      };
  }
}

function applyExtractionToReceiptFields(
  extraction: ReceiptOcrExtraction,
  taxYearId: string | null
) {
  return {
    merchant_name: extraction.merchant,
    receipt_date: extraction.receiptDate,
    total_amount: extraction.totalAmount,
    vat_amount: extraction.vatAmount,
    payment_method: extraction.paymentMethod,
    tax_year_id: taxYearId,
    ocr_data: extractionToOcrData(extraction),
    source: "receipt_capture" as const,
  };
}

export async function captureReceipt(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose a photo or file." };
  }

  if (!isAllowedReceiptFile(file)) {
    return {
      success: false,
      error: "File type not supported. Use PDF, JPG, PNG, or HEIC.",
    };
  }

  if (file.size > MAX_RECEIPT_FILE_BYTES) {
    return { success: false, error: "File is too large (max 10 MB)." };
  }

  const tax_year_id = String(formData.get("tax_year_id") ?? "").trim() || null;
  const taxYears = await getTaxYears(user.id);
  const taxYearLabel =
    taxYears.find((ty) => ty.id === tax_year_id)?.label ?? null;

  const storagePath = buildReceiptStoragePath(
    user.id,
    taxYearLabel,
    file.name
  );
  const mimeType = guessMimeType(file.name, file.type);
  const buffer = Buffer.from(await file.arrayBuffer());

  const extraction = await extractReceiptFromBuffer(buffer, mimeType);

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const fields = applyExtractionToReceiptFields(extraction, tax_year_id);

  const { data, error } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: mimeType,
      file_size_bytes: file.size,
      notes: null,
      ...fields,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([storagePath]);
    return { success: false, error: error.message };
  }

  await ensureReceiptAccounts(user.id, supabase);

  revalidateCapturePaths();
  return { success: true, data: { id: data.id } };
}

export async function getReceiptCaptureReview(
  receiptId: string
): Promise<ActionResult<ReceiptCaptureReviewData>> {
  const user = await requireAuth();
  const receipt = await getReceiptById(user.id, receiptId);

  if (!receipt) {
    return { success: false, error: "Receipt not found." };
  }

  const transactions = await getMatchableTransactions(user.id, {
    taxYearId: receipt.tax_year_id,
    receiptId: receipt.id,
  });

  const candidates = rankTransactionMatches(receipt, transactions, {
    limit: 12,
  });

  const ocr =
    receipt.ocr_data && typeof receipt.ocr_data === "object"
      ? (receipt.ocr_data as Record<string, unknown>)
      : null;

  const extraction: ReceiptOcrExtraction = {
    merchant: receipt.merchant_name,
    receiptDate: receipt.receipt_date,
    totalAmount:
      receipt.total_amount !== null ? Number(receipt.total_amount) : null,
    vatAmount: receipt.vat_amount !== null ? Number(receipt.vat_amount) : null,
    paymentMethod: receipt.payment_method,
    rawText: ocr?.raw_text ? String(ocr.raw_text) : null,
    confidence:
      (ocr?.confidence as ReceiptOcrExtraction["confidence"] | undefined) ??
      "medium",
    fieldsFound: Array.isArray(ocr?.fields_found)
      ? (ocr.fields_found as string[])
      : [],
  };

  return {
    success: true,
    data: {
      receipt,
      extraction,
      suggestedMatch: candidates[0] ?? null,
      candidates,
    },
  };
}

export async function createTransactionFromReceipt(
  receiptId: string,
  input: CreateTransactionFromReceiptInput
): Promise<ActionResult<{ transactionId: string }>> {
  const user = await requireAuth();
  const receipt = await getReceiptById(user.id, receiptId);

  if (!receipt) {
    return { success: false, error: "Receipt not found." };
  }

  if (receipt.attached_transaction) {
    return {
      success: false,
      error: "This receipt is already linked to a transaction.",
    };
  }

  const amount = Number(receipt.total_amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      error: "Enter a total amount on the receipt before creating a transaction.",
    };
  }

  const transactionDate = receipt.receipt_date;
  if (!transactionDate) {
    return {
      success: false,
      error: "Enter a receipt date before creating a transaction.",
    };
  }

  const [accounts, rules, taxYears] = await Promise.all([
    ensureReceiptAccounts(user.id),
    getCategorizationRules(user.id, { activeOnly: true }),
    getTaxYears(user.id),
    ensureDefaultCategories(user.id),
  ]);

  const defaults = kindToTransactionDefaults(input.kind, accounts);
  const accountId = defaults.accountId;

  if (!accountId) {
    return { success: false, error: "No account available. Try again shortly." };
  }

  const merchant = receipt.merchant_name?.trim() ?? "";
  const parsed: TransactionFormInput = {
    account_id: accountId,
    transaction_date: transactionDate,
    description: merchant || "Receipt",
    merchant_name: merchant,
    amount,
    direction: defaults.direction,
    category_id: input.category_id ?? null,
    hmrc_category_id: input.hmrc_category_id ?? null,
    is_business: input.is_business ?? defaults.isBusiness,
    business_use_percent:
      input.is_business ?? defaults.isBusiness
        ? (input.business_use_percent ?? 100)
        : null,
    notes: input.notes?.trim() ?? "",
  };

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

  const captureMeta = {
    source: "receipt_capture",
    receipt_id: receiptId,
    kind: input.kind,
  };

  const rawImportData = applied.matched_rule
    ? mergeRawImportCategorization(
        captureMeta,
        buildCategorizationMetadata(applied.matched_rule)
      )
    : captureMeta;

  const taxYearId =
    receipt.tax_year_id ??
    findTaxYearForDate(taxYears, categorizedInput.transaction_date)?.id ??
    null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: categorizedInput.account_id,
      transaction_date: categorizedInput.transaction_date,
      description: categorizedInput.description.trim() || null,
      merchant_name: categorizedInput.merchant_name.trim() || null,
      amount: categorizedInput.amount,
      direction: categorizedInput.direction,
      category_id: categorizedInput.category_id,
      hmrc_category_id: categorizedInput.hmrc_category_id,
      is_business: categorizedInput.is_business,
      business_use_percent: categorizedInput.is_business
        ? categorizedInput.business_use_percent
        : null,
      notes: categorizedInput.notes.trim() || null,
      tax_year_id: taxYearId,
      raw_import_data: rawImportData,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (applied.matched_rule) {
    await incrementRulesTimesMatched(user.id, [applied.matched_rule.id]);
  }

  const link = await attachReceiptToTransaction(receiptId, data.id);
  if (!link.success) {
    return {
      success: false,
      error: link.error ?? "Transaction created but receipt could not be linked.",
    };
  }

  revalidateCapturePaths();
  return { success: true, data: { transactionId: data.id } };
}
