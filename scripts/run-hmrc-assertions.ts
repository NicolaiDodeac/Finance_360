import { assertHmrcResolutionInvariants } from "../src/lib/categorization/hmrc-resolution";
import { dryRunRuleRepair } from "../src/lib/categorization/rule-repair";
import type { CategorizationRuleRow } from "../src/lib/categorization/types";
import type { CategoryRow } from "../src/lib/categories/queries";

const mockCategory = {
  id: "cat-sub",
  slug: "subscriptions",
  name: "Subscriptions",
  user_id: "u1",
  hmrc_category_id: null,
  parent_id: null,
  icon: null,
  color: null,
  is_allowable_expense: false,
  sort_order: 0,
  created_at: "",
  updated_at: "",
} satisfies CategoryRow;

assertHmrcResolutionInvariants();

const hmrcCategories = [
  {
    id: "hmrc-office",
    code: "phone_office_stationery",
    name: "Office costs",
    description: null,
    sa_box: "23",
    is_allowable_expense: true,
    sort_order: 70,
    created_at: "",
  },
];

const preview = dryRunRuleRepair(
  [
    {
      id: "rule-cursor",
      user_id: "u1",
      name: "Remember: CURSOR",
      match_field: "both",
      match_type: "contains",
      match_value: "CURSOR",
      category_id: "cat-sub",
      hmrc_category_id: null,
      is_business: true,
      priority: 10,
      is_active: true,
      times_matched: 3,
      created_at: "",
      updated_at: "",
    } satisfies CategorizationRuleRow,
  ],
  [mockCategory],
  hmrcCategories
);

if (preview.repairableCount !== 1) {
  throw new Error("Expected one repairable CURSOR/subscriptions rule");
}
if (preview.repairable[0]?.proposedHmrcCategoryCode !== "phone_office_stationery") {
  throw new Error("CURSOR rule repair should map to office costs");
}

const personalPreview = dryRunRuleRepair(
  [
    {
      id: "rule-netflix",
      user_id: "u1",
      name: "Netflix",
      match_field: "both",
      match_type: "contains",
      match_value: "NETFLIX",
      category_id: "cat-sub",
      hmrc_category_id: null,
      is_business: false,
      priority: 10,
      is_active: true,
      times_matched: 1,
      created_at: "",
      updated_at: "",
    } satisfies CategorizationRuleRow,
  ],
  [mockCategory],
  hmrcCategories
);

if (personalPreview.repairableCount !== 0) {
  throw new Error("Personal rules must not be repairable");
}

console.log("HMRC categorisation assertions passed.");
