"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import {
  defaultBudgetName,
  getCurrentPeriod,
  SUGGESTED_BUDGET_CATEGORY_SLUGS,
} from "@/lib/budget/calculations";
import { getBudgetForPeriod } from "@/lib/budget/queries";
import { getCategories } from "@/lib/categories/queries";
import { getSelectableCategories } from "@/lib/categories/display";
import { getActiveSpaceContext, canManageSpace } from "@/lib/spaces/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/transactions/types";

interface BudgetLineInput {
  categoryId: string;
  targetAmount: number;
  warningThreshold?: number | null;
}

export async function createMonthlyBudget(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);

  const canManage = await canManageSpace(user.id, space.id);
  if (!canManage) {
    return {
      success: false,
      error: "Only space owners and admins can create a monthly plan.",
    };
  }

  const period = getCurrentPeriod();
  const existing = await getBudgetForPeriod(space.id, period.year, period.month);
  if (existing.budget) {
    return {
      success: false,
      error: "A plan already exists for this month. Edit it below.",
    };
  }

  const categories = getSelectableCategories(await getCategories(user.id));
  const slugToCategory = new Map(categories.map((c) => [c.slug, c]));

  const lines: BudgetLineInput[] = [];
  for (const slug of SUGGESTED_BUDGET_CATEGORY_SLUGS) {
    const raw = Number(formData.get(`target_${slug}`));
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const category = slugToCategory.get(slug);
    if (!category) continue;
    lines.push({ categoryId: category.id, targetAmount: raw });
  }

  const customCategoryId = String(formData.get("custom_category_id") ?? "").trim();
  const customTarget = Number(formData.get("custom_target_amount"));
  if (customCategoryId && Number.isFinite(customTarget) && customTarget > 0) {
    lines.push({ categoryId: customCategoryId, targetAmount: customTarget });
  }

  if (lines.length === 0) {
    return {
      success: false,
      error: "Add at least one category with a monthly target.",
    };
  }

  const supabase = await createClient();
  const name =
    String(formData.get("name") ?? "").trim() || defaultBudgetName(period);

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      space_id: space.id,
      month: period.month,
      year: period.year,
      name,
    })
    .select("id")
    .single();

  if (budgetError || !budget) {
    return { success: false, error: budgetError?.message ?? "Could not create plan." };
  }

  const { error: itemsError } = await supabase.from("budget_items").insert(
    lines.map((line) => ({
      budget_id: budget.id,
      category_id: line.categoryId,
      target_amount: line.targetAmount,
      warning_threshold: line.warningThreshold ?? null,
    }))
  );

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function createMonthlyBudgetForm(formData: FormData): Promise<void> {
  await createMonthlyBudget(formData);
}

export async function upsertBudgetItem(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);

  if (!(await canManageSpace(user.id, space.id))) {
    return { success: false, error: "You cannot edit this plan." };
  }

  const categoryId = String(formData.get("category_id") ?? "").trim();
  const targetRaw = Number(formData.get("target_amount"));

  if (!categoryId) {
    return { success: false, error: "Choose a category." };
  }
  if (!Number.isFinite(targetRaw) || targetRaw <= 0) {
    return { success: false, error: "Target must be greater than zero." };
  }

  const period = getCurrentPeriod();
  const { budget } = await getBudgetForPeriod(space.id, period.year, period.month);

  if (!budget) {
    return { success: false, error: "Create a monthly plan first." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("budget_items").upsert(
    {
      budget_id: budget.id,
      category_id: categoryId,
      target_amount: targetRaw,
    },
    { onConflict: "budget_id,category_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function upsertBudgetItemForm(formData: FormData): Promise<void> {
  await upsertBudgetItem(formData);
}
