"use server";

import { revalidatePath } from "next/cache";
import type { ReceiptStatus } from "@/lib/receipts/status";
import {
  applyCategorizationRules,
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
import { buildAssistantPatchFromResolved } from "@/lib/categorization/categorise-flow/assistant-patch";
import {
  resolveCategoryChoice,
  resolvePurposeNotSure,
} from "@/lib/categorization/categorise-flow/resolve";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import { incrementRulesTimesMatched } from "@/lib/categorization/increment";
import { getCategorizationRules } from "@/lib/categorization/queries";
import { mergeAssistantMetadata } from "@/lib/categorization/assistant-metadata";
import {
  ensureReceiptAccounts,
  findCashManualAccountId,
  findManualAccountId,
} from "@/lib/accounts/queries";
import { getCategories } from "@/lib/categories/queries";
import { requireAuth } from "@/lib/auth/helpers";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import {
  MAX_RECEIPT_FILE_BYTES,
  RECEIPTS_BUCKET,
} from "@/lib/receipts/constants";
import {
  choiceIdForPurpose,
  classifyReceiptText,
} from "@/lib/receipts/classify";
import {
  extractionToOcrData,
  extractReceiptFromBuffer,
} from "@/lib/receipts/ocr/extract";
import {
  EMPTY_RECEIPT_EXTRACTION,
  type ReceiptOcrExtraction,
} from "@/lib/receipts/ocr/types";
import { findSimilarReceipts } from "@/lib/receipts/duplicate-receipts";
import { rankTransactionMatches } from "@/lib/receipts/match";
import {
  getMatchableTransactions,
  getReceiptById,
} from "@/lib/receipts/queries";
import { deriveReceiptStatus } from "@/lib/receipts/status";
import {
  buildReceiptCreationSuggestion,
  needsPaymentPrompt,
} from "@/lib/receipts/suggest";
import {
  buildReceiptStoragePath,
  guessMimeType,
  isAllowedReceiptFile,
} from "@/lib/receipts/storage";
import type {
  ActionResult,
  CreateTransactionFromReceiptInput,
  ReceiptCaptureReviewData,
} from "@/lib/receipts/types";
import { attachReceiptToTransaction } from "@/lib/receipts/actions";
import { ensureProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { findTaxYearForDate, getTaxYears } from "@/lib/tax-years/queries";
import type { ReceiptPaymentMethod } from "@/types/database";

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

function accountIdForPayment(
  payment: ReceiptPaymentMethod | null,
  accounts: Awaited<ReturnType<typeof ensureReceiptAccounts>>
): string {
  const cashId = findCashManualAccountId(accounts);
  const manualId = findManualAccountId(accounts);

  if (payment === "cash") {
    return cashId || manualId;
  }
  return manualId || cashId;
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

  const { data, error } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: mimeType,
      file_size_bytes: file.size,
      notes: null,
      merchant_name: null,
      receipt_date: null,
      total_amount: null,
      vat_amount: null,
      payment_method: null,
      tax_year_id: tax_year_id,
      ocr_data: null,
      source: "receipt_capture" as const,
      status: "processing" as const,
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

  const [profile, categories, hmrcCategories] = await Promise.all([
    ensureProfile(user.id),
    ensureDefaultCategories(user.id).then(() => getCategories(user.id)),
    getHmrcCategories(),
  ]);

  const financeMode = profile?.finance_mode ?? "personal";

  const [transactions, similarReceipts] = await Promise.all([
    getMatchableTransactions(user.id, {
      taxYearId: receipt.tax_year_id,
    }),
    findSimilarReceipts(user.id, receipt),
  ]);

  const ranked = rankTransactionMatches(receipt, transactions, {
    limit: 12,
    currentReceiptId: receipt.id,
  });

  const ocr =
    receipt.ocr_data && typeof receipt.ocr_data === "object"
      ? (receipt.ocr_data as Record<string, unknown>)
      : null;

  const extraction: ReceiptOcrExtraction = {
    merchant: receipt.merchant_name,
    merchantSource:
      (ocr?.merchant_source as ReceiptOcrExtraction["merchantSource"]) ??
      "unknown",
    knownMerchantId:
      typeof ocr?.known_merchant_id === "string"
        ? ocr.known_merchant_id
        : null,
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

  const classification = classifyReceiptText(
    receipt.merchant_name,
    extraction.rawText
  );

  const creationSuggestion = buildReceiptCreationSuggestion({
    financeMode,
    merchant: receipt.merchant_name,
    rawText: extraction.rawText,
    paymentMethod: receipt.payment_method,
    categories,
    hmrcCategories,
  });

  const receiptStatus = deriveReceiptStatus(
    {
      merchant_name: receipt.merchant_name,
      total_amount: receipt.total_amount,
      receipt_date: receipt.receipt_date,
      status: receipt.status ?? "ready",
      attached: Boolean(receipt.attached_transaction),
    },
    extraction
  );

  return {
    success: true,
    data: {
      receipt,
      receiptStatus,
      extraction,
      suggestedMatch: ranked.suggestedMatch,
      closestMatch: ranked.closestMatch,
      candidates: ranked.candidates,
      financeMode,
      creationSuggestion,
      showPaymentPrompt: needsPaymentPrompt(receipt.payment_method),
      classificationLooksBusiness: classification.looksBusinessRelevant,
      similarReceipts,
    },
  };
}

export async function createTransactionFromReceipt(
  receiptId: string,
  input: CreateTransactionFromReceiptInput
): Promise<ActionResult<{ transactionId: string }>> {
  if (input.skip) {
    return { success: true, data: { transactionId: "" } };
  }

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
      error: "Add the total amount on the receipt before saving.",
    };
  }

  const transactionDate = receipt.receipt_date;
  if (!transactionDate) {
    return {
      success: false,
      error: "Add the receipt date before saving.",
    };
  }

  if (input.purpose === "personal" && input.record_as_income) {
    return {
      success: false,
      error: "Choose business income only for business turnover.",
    };
  }

  const payment: ReceiptPaymentMethod | null =
    input.payment_method ?? receipt.payment_method;

  const [accounts, rules, taxYears, categories, hmrcCategories] =
    await Promise.all([
      ensureReceiptAccounts(user.id),
      getCategorizationRules(user.id, { activeOnly: true }),
      getTaxYears(user.id),
      getCategories(user.id),
      getHmrcCategories(),
    ]);

  const accountId = accountIdForPayment(payment, accounts);
  if (!accountId) {
    return { success: false, error: "No account available. Try again shortly." };
  }

  const merchant = receipt.merchant_name?.trim() ?? "";
  const classification = classifyReceiptText(
    receipt.merchant_name,
    receipt.ocr_data &&
      typeof receipt.ocr_data === "object" &&
      "raw_text" in receipt.ocr_data
      ? String((receipt.ocr_data as { raw_text?: string }).raw_text ?? "")
      : null
  );

  const isIncome = Boolean(input.record_as_income && input.income_kind);
  const direction = isIncome ? ("income" as const) : ("expense" as const);

  let categoryId: string | null = null;
  let hmrcCategoryId: string | null = null;
  let isBusiness = false;
  let businessUsePercent: number | null = null;
  let assistantPatch = buildAssistantPatchFromResolved(
    resolvePurposeNotSure(),
    undefined,
    "receipt_capture"
  );

  if (isIncome && input.income_kind) {
    isBusiness = input.income_kind === "business_income";
    const incomeChoice: CategoryChoiceId = isBusiness
      ? "business_turnover"
      : "other_personal_income";
    const resolved = resolveCategoryChoice(
      isBusiness ? "business" : "personal",
      incomeChoice,
      categories,
      hmrcCategories,
      null
    );
    categoryId = resolved.categoryId;
    hmrcCategoryId = null;
    assistantPatch = buildAssistantPatchFromResolved(
      resolved,
      incomeChoice,
      "receipt_capture"
    );
  } else if (input.purpose === "not_sure") {
    const resolved = resolvePurposeNotSure();
    assistantPatch = buildAssistantPatchFromResolved(
      resolved,
      undefined,
      "receipt_capture"
    );
  } else {
    const choiceId =
      choiceIdForPurpose(input.purpose, classification) ??
      (input.purpose === "business"
        ? "other_business_expense"
        : "other_personal_expense");

    const resolved = resolveCategoryChoice(
      input.purpose,
      choiceId,
      categories,
      hmrcCategories,
      input.purpose === "business" ? 100 : null
    );

    categoryId = resolved.categoryId;
    hmrcCategoryId =
      input.purpose === "business" ? resolved.hmrcCategoryId : null;
    isBusiness = input.purpose === "business" && resolved.isBusiness;
    businessUsePercent =
      input.purpose === "business" ? (resolved.businessUsePercent ?? 100) : null;

    assistantPatch = buildAssistantPatchFromResolved(
      resolved,
      choiceId,
      "receipt_capture"
    );
  }

  const applied = applyCategorizationRules(
    {
      description: merchant || "Receipt",
      merchant_name: merchant || null,
    },
    rules,
    {
      onlyFillEmpty: true,
      existing: {
        category_id: categoryId,
        hmrc_category_id: hmrcCategoryId,
        is_business: isBusiness,
      },
    }
  );

  categoryId = applied.category_id ?? categoryId;
  hmrcCategoryId =
    input.purpose === "business"
      ? (applied.hmrc_category_id ?? hmrcCategoryId)
      : null;
  isBusiness = applied.is_business ?? isBusiness;

  const captureMeta: Record<string, unknown> = {
    source: "receipt_capture",
    receipt_id: receiptId,
    purpose: input.purpose,
    payment_method: payment,
  };

  let rawImportData = mergeAssistantMetadata(captureMeta, assistantPatch);

  if (applied.matched_rule) {
    rawImportData = mergeRawImportCategorization(
      rawImportData,
      buildCategorizationMetadata(applied.matched_rule)
    );
  }

  const taxYearId =
    receipt.tax_year_id ??
    findTaxYearForDate(taxYears, transactionDate)?.id ??
    null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: accountId,
      transaction_date: transactionDate,
      description: merchant || "Receipt",
      merchant_name: merchant || null,
      amount,
      direction,
      category_id: categoryId,
      hmrc_category_id: hmrcCategoryId,
      is_business: isBusiness,
      business_use_percent: isBusiness ? businessUsePercent : null,
      notes: null,
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

  if (payment && payment !== receipt.payment_method) {
    await supabase
      .from("receipts")
      .update({ payment_method: payment })
      .eq("id", receiptId)
      .eq("user_id", user.id);
  }

  const link = await attachReceiptToTransaction(receiptId, data.id);
  if (!link.success) {
    return {
      success: false,
      error:
        link.error ?? "Saved, but the receipt could not be linked. Try again.",
    };
  }

  revalidateCapturePaths();
  return { success: true, data: { transactionId: data.id } };
}

export interface RetryReceiptOcrResult {
  status: ReceiptStatus;
  fieldsFound: string[];
  merchant: string | null;
  receiptDate: string | null;
  totalAmount: number | null;
}

/** Run OCR on a stored receipt (initial capture or retry). */
export async function runReceiptCaptureOcr(
  receiptId: string
): Promise<ActionResult<RetryReceiptOcrResult>> {
  return retryReceiptOcr(receiptId);
}

/** Re-run OCR on an existing receipt file and refresh metadata. */
export async function retryReceiptOcr(
  receiptId: string
): Promise<ActionResult<RetryReceiptOcrResult>> {
  const user = await requireAuth();
  const receipt = await getReceiptById(user.id, receiptId);

  if (!receipt) {
    return { success: false, error: "Receipt not found." };
  }

  const supabase = await createClient();
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .download(receipt.storage_path);

  if (downloadError || !fileData) {
    return {
      success: false,
      error: downloadError?.message ?? "Could not load receipt file.",
    };
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const mimeType =
    receipt.mime_type ?? guessMimeType(receipt.original_filename ?? ".jpg");
  const extraction = await extractReceiptFromBuffer(buffer, mimeType);

  if (extraction.ocrError && !extraction.rawText?.trim()) {
    await supabase
      .from("receipts")
      .update({
        status: "needs_review",
        ocr_data: {
          ...extractionToOcrData(EMPTY_RECEIPT_EXTRACTION),
          scan_error: extraction.ocrError ?? null,
        },
      })
      .eq("id", receiptId)
      .eq("user_id", user.id);

    revalidateCapturePaths();
    revalidatePath(`/receipts/review/${receiptId}`);

    return {
      success: false,
      error: extraction.ocrError,
    };
  }

  const taxYearId = receipt.tax_year_id;
  const fields = applyExtractionToReceiptFields(extraction, taxYearId);
  const status = deriveReceiptStatus(
    {
      merchant_name: fields.merchant_name,
      total_amount: fields.total_amount,
      receipt_date: fields.receipt_date,
      status: "ready",
    },
    extraction
  );

  const { error } = await supabase
    .from("receipts")
    .update({ ...fields, status })
    .eq("id", receiptId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateCapturePaths();
  revalidatePath(`/receipts/review/${receiptId}`);

  return {
    success: true,
    data: {
      status,
      fieldsFound: extraction.fieldsFound,
      merchant: fields.merchant_name,
      receiptDate: fields.receipt_date,
      totalAmount: fields.total_amount,
    },
  };
}
