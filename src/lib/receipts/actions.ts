"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import {
  MAX_RECEIPT_FILE_BYTES,
  RECEIPTS_BUCKET,
} from "@/lib/receipts/constants";
import { rankTransactionMatches } from "@/lib/receipts/match";
import {
  getMatchableTransactions,
  getReceiptById,
} from "@/lib/receipts/queries";
import type { ReceiptMatchCandidate } from "@/lib/receipts/types";
import {
  buildReceiptStoragePath,
  guessMimeType,
  isAllowedReceiptFile,
} from "@/lib/receipts/storage";
import type { ActionResult, ReceiptFormInput } from "@/lib/receipts/types";
import type { ReceiptPaymentMethod } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { getTaxYears } from "@/lib/tax-years/queries";

const REVALIDATE_PATHS = ["/receipts", "/transactions", "/tax"] as const;

function revalidateReceiptPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

function parseOptionalAmount(
  value: FormDataEntryValue | null
): number | null {
  if (value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function parseReceiptMetadata(formData: FormData): {
  metadata: ReceiptFormInput;
  taxYearId: string | null;
  error?: string;
} {
  const merchant_name = String(formData.get("merchant_name") ?? "").trim();
  const receipt_date = String(formData.get("receipt_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const tax_year_id = String(formData.get("tax_year_id") ?? "").trim() || null;
  const total_amount = parseOptionalAmount(formData.get("total_amount"));
  const vat_amount = parseOptionalAmount(formData.get("vat_amount"));
  const paymentRaw = String(formData.get("payment_method") ?? "").trim();
  const payment_method: ReceiptPaymentMethod | null =
    paymentRaw === "cash" ||
    paymentRaw === "card" ||
    paymentRaw === "contactless" ||
    paymentRaw === "unknown"
      ? paymentRaw
      : null;

  if (total_amount === null && formData.get("total_amount")) {
    return {
      metadata: {
        merchant_name,
        receipt_date,
        total_amount: null,
        vat_amount: null,
        payment_method,
        notes,
        tax_year_id,
      },
      taxYearId: tax_year_id,
      error: "Total amount must be a valid number.",
    };
  }

  if (vat_amount === null && formData.get("vat_amount")) {
    return {
      metadata: {
        merchant_name,
        receipt_date,
        total_amount,
        vat_amount: null,
        payment_method,
        notes,
        tax_year_id,
      },
      taxYearId: tax_year_id,
      error: "VAT amount must be a valid number.",
    };
  }

  return {
    metadata: {
      merchant_name,
      receipt_date,
      total_amount,
      vat_amount,
      payment_method,
      notes,
      tax_year_id,
    },
    taxYearId: tax_year_id,
  };
}

async function resolveTaxYearLabel(
  userId: string,
  taxYearId: string | null
): Promise<string | null> {
  if (!taxYearId) return null;

  const taxYears = await getTaxYears(userId);
  return taxYears.find((ty) => ty.id === taxYearId)?.label ?? null;
}

export async function uploadReceipt(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose a file to upload." };
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

  const { metadata, taxYearId, error: metaError } = parseReceiptMetadata(formData);
  if (metaError) {
    return { success: false, error: metaError };
  }

  const taxYearLabel = await resolveTaxYearLabel(user.id, taxYearId);
  const storagePath = buildReceiptStoragePath(
    user.id,
    taxYearLabel,
    file.name
  );
  const mimeType = guessMimeType(file.name, file.type);

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

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
      merchant_name: metadata.merchant_name || null,
      receipt_date: metadata.receipt_date || null,
      total_amount: metadata.total_amount,
      vat_amount: metadata.vat_amount,
      payment_method: metadata.payment_method,
      notes: metadata.notes || null,
      tax_year_id: taxYearId,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([storagePath]);
    return { success: false, error: error.message };
  }

  revalidateReceiptPaths();
  return { success: true, data: { id: data.id } };
}

export async function updateReceiptMetadata(
  receiptId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { metadata, taxYearId, error: metaError } = parseReceiptMetadata(formData);

  if (metaError) {
    return { success: false, error: metaError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("receipts")
    .update({
      merchant_name: metadata.merchant_name || null,
      receipt_date: metadata.receipt_date || null,
      total_amount: metadata.total_amount,
      vat_amount: metadata.vat_amount,
      payment_method: metadata.payment_method,
      notes: metadata.notes || null,
      tax_year_id: taxYearId,
    })
    .eq("id", receiptId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateReceiptPaths();
  return { success: true };
}

export async function attachReceiptToTransaction(
  receiptId: string,
  transactionId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const receipt = await getReceiptById(user.id, receiptId);
  if (!receipt) {
    return { success: false, error: "Receipt not found." };
  }

  const { data: transaction, error: txFetchError } = await supabase
    .from("transactions")
    .select("id, receipt_id")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (txFetchError || !transaction) {
    return { success: false, error: "Transaction not found." };
  }

  await supabase
    .from("transactions")
    .update({ receipt_id: null })
    .eq("user_id", user.id)
    .eq("receipt_id", receiptId);

  const { error } = await supabase
    .from("transactions")
    .update({ receipt_id: receiptId })
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateReceiptPaths();
  return { success: true };
}

export async function detachReceiptFromTransaction(
  transactionId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("transactions")
    .update({ receipt_id: null })
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateReceiptPaths();
  return { success: true };
}

export async function deleteReceipt(receiptId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const receipt = await getReceiptById(user.id, receiptId);
  if (!receipt) {
    return { success: false, error: "Receipt not found." };
  }

  await supabase
    .from("transactions")
    .update({ receipt_id: null })
    .eq("user_id", user.id)
    .eq("receipt_id", receiptId);

  const { error: deleteRowError } = await supabase
    .from("receipts")
    .delete()
    .eq("id", receiptId)
    .eq("user_id", user.id);

  if (deleteRowError) {
    return { success: false, error: deleteRowError.message };
  }

  await supabase.storage.from(RECEIPTS_BUCKET).remove([receipt.storage_path]);

  revalidateReceiptPaths();
  return { success: true };
}

export async function getReceiptMatchCandidates(
  receiptId: string
): Promise<ActionResult<ReceiptMatchCandidate[]>> {
  const user = await requireAuth();
  const receipt = await getReceiptById(user.id, receiptId);

  if (!receipt) {
    return { success: false, error: "Receipt not found." };
  }

  const transactions = await getMatchableTransactions(user.id, {
    taxYearId: receipt.tax_year_id,
    receiptId: receipt.id,
  });

  const ranked = rankTransactionMatches(receipt, transactions);
  return { success: true, data: ranked.candidates };
}

export async function getReceiptPreviewUrl(
  receiptId: string
): Promise<ActionResult<{ url: string }>> {
  const user = await requireAuth();
  const receipt = await getReceiptById(user.id, receiptId);

  if (!receipt) {
    return { success: false, error: "Receipt not found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(receipt.storage_path, 60 * 60);

  if (error || !data?.signedUrl) {
    return { success: false, error: "Could not load file preview." };
  }

  return { success: true, data: { url: data.signedUrl } };
}

export async function uploadAndAttachReceipt(
  transactionId: string,
  formData: FormData
): Promise<ActionResult> {
  const upload = await uploadReceipt(formData);
  if (!upload.success || !upload.data?.id) {
    return { success: false, error: upload.error ?? "Upload failed." };
  }

  return attachReceiptToTransaction(upload.data.id, transactionId);
}
