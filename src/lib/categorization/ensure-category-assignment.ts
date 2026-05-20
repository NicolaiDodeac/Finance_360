import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import {
  INCOME_TYPE_SPECS,
  isIncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
import { isCategoryChoiceId } from "@/lib/categorization/categorise-flow/prefill";
import type { GroupCategorisationInput } from "@/lib/categorization/assistant-types";
import { ensureCategoryBySlug } from "@/lib/categories/ensure-slug";

function categorySlugFromGroupInput(
  input: GroupCategorisationInput
): string | null {
  if (input.income_type && isIncomeTypeChoiceId(input.income_type)) {
    return INCOME_TYPE_SPECS[input.income_type].categorySlug;
  }
  if (input.category_choice && isCategoryChoiceId(input.category_choice)) {
    return CHOICE_SPECS[input.category_choice].categorySlug;
  }
  return null;
}

/**
 * When the client could not resolve a category id (missing slug in DB),
 * create the default category for this user and attach it before apply.
 */
export async function ensureCategoryAssignment(
  userId: string,
  input: GroupCategorisationInput
): Promise<GroupCategorisationInput> {
  if (input.mark_review_recommended || input.category_id) {
    return input;
  }

  const slug = categorySlugFromGroupInput(input);
  if (!slug) {
    return input;
  }

  const category = await ensureCategoryBySlug(userId, slug);
  if (!category?.id) {
    return input;
  }

  return { ...input, category_id: category.id };
}
