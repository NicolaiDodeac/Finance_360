import {
  hmrcCodeForCategoryChoice,
  resolveHmrcFromChoice,
  shouldAssignHmrcCategory,
} from "@/lib/categorization/hmrc-resolution";
import type { GroupCategorisationInput } from "@/lib/categorization/assistant-types";
import { getHmrcCategories } from "@/lib/hmrc/queries";

/**
 * Ensures business expenses get hmrc_category_id from the flow mapping when the
 * client omitted it; strips HMRC from personal and income categorisations.
 */
export async function ensureHmrcCategoryAssignment(
  input: GroupCategorisationInput
): Promise<GroupCategorisationInput> {
  if (!shouldAssignHmrcCategory(input)) {
    if (input.hmrc_category_id) {
      return { ...input, hmrc_category_id: null };
    }
    return input;
  }

  if (input.hmrc_category_id) {
    return input;
  }

  const hmrcCode = hmrcCodeForCategoryChoice(input.category_choice);
  if (!hmrcCode) {
    return input;
  }

  const hmrcCategories = await getHmrcCategories();
  const hmrc = resolveHmrcFromChoice(hmrcCategories, hmrcCode, undefined);

  return {
    ...input,
    hmrc_category_id: hmrc?.id ?? null,
  };
}
