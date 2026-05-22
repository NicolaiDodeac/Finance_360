import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import { isCategoryChoiceId } from "@/lib/categorization/categorise-flow/prefill";
import type { GroupCategorisationInput } from "@/lib/categorization/assistant-types";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

/** Resolve HMRC row: undefined = use mapping code; null = explicit none; string = user override. */
export function resolveHmrcFromChoice(
  hmrcCategories: HmrcCategoryRow[],
  hmrcCode: string | null | undefined,
  hmrcOverrideId?: string | null
): HmrcCategoryRow | null {
  if (typeof hmrcOverrideId === "string" && hmrcOverrideId.length > 0) {
    return hmrcCategories.find((h) => h.id === hmrcOverrideId) ?? null;
  }
  if (hmrcOverrideId === null) {
    return null;
  }
  if (!hmrcCode) {
    return null;
  }
  return hmrcCategories.find((h) => h.code === hmrcCode) ?? null;
}

export function hmrcCodeForCategoryChoice(
  categoryChoice: string | undefined
): string | null {
  if (!categoryChoice || !isCategoryChoiceId(categoryChoice)) {
    return null;
  }
  return CHOICE_SPECS[categoryChoice].hmrcCode ?? null;
}

/** Business expenses need HMRC; personal and income must not. */
export function shouldAssignHmrcCategory(
  input: Pick<
    GroupCategorisationInput,
    | "mark_review_recommended"
    | "income_type"
    | "purpose"
    | "is_business"
    | "category_choice"
  >
): boolean {
  if (input.mark_review_recommended) {
    return false;
  }
  if (input.income_type) {
    return false;
  }
  if (input.purpose === "personal" || input.purpose === "not_sure") {
    return false;
  }
  return Boolean(input.is_business && input.category_choice);
}

export function assertHmrcResolutionInvariants(): void {
  const categories: HmrcCategoryRow[] = [
    {
      id: "hmrc-office",
      code: "phone_office_stationery",
      name: "Phone, fax, stationery and other office costs",
      description: null,
      sa_box: "23",
      is_allowable_expense: true,
      sort_order: 70,
      created_at: "",
    },
  ];

  const fromCode = resolveHmrcFromChoice(
    categories,
    "phone_office_stationery",
    undefined
  );
  if (fromCode?.id !== "hmrc-office") {
    throw new Error("resolveHmrcFromChoice should map HMRC code to id");
  }

  const blockedByNullOverride = resolveHmrcFromChoice(
    categories,
    "phone_office_stationery",
    null
  );
  if (blockedByNullOverride !== null) {
    throw new Error("null hmrcOverrideId should mean explicit no HMRC category");
  }

  const softwareCode = hmrcCodeForCategoryChoice("software_digital");
  if (softwareCode !== "phone_office_stationery") {
    throw new Error("software_digital should map to office costs HMRC code");
  }

  if (
    shouldAssignHmrcCategory({
      is_business: false,
      purpose: "personal",
      category_choice: "subscriptions",
    })
  ) {
    throw new Error("personal expenses must not assign HMRC");
  }

  if (
    shouldAssignHmrcCategory({
      is_business: true,
      income_type: "employment_salary",
      purpose: "business",
      category_choice: undefined,
    })
  ) {
    throw new Error("income must not assign HMRC");
  }

  if (
    !shouldAssignHmrcCategory({
      is_business: true,
      purpose: "business",
      category_choice: "software_digital",
    })
  ) {
    throw new Error("business expense choices should allow HMRC assignment");
  }
}
