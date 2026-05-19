import type {
  CategorizationRuleFormInput,
  CategorizationRuleRow,
} from "@/lib/categorization/types";
import type { TransactionFormInput } from "@/lib/transactions/types";

export function emptyRuleForm(): CategorizationRuleFormInput {
  return {
    name: "",
    match_field: "both",
    match_type: "contains",
    keyword: "",
    category_id: null,
    hmrc_category_id: null,
    is_business: null,
    priority: 0,
    is_active: true,
  };
}

export function ruleToFormInput(rule: CategorizationRuleRow): CategorizationRuleFormInput {
  return {
    name: rule.name,
    match_field: rule.match_field,
    match_type: rule.match_type,
    keyword: rule.match_value,
    category_id: rule.category_id,
    hmrc_category_id: rule.hmrc_category_id,
    is_business: rule.is_business,
    priority: rule.priority,
    is_active: rule.is_active,
  };
}

export function ruleFormFromTransaction(
  form: TransactionFormInput,
  description: string
): CategorizationRuleFormInput {
  const keyword =
    form.description.trim() ||
    form.merchant_name.trim() ||
    description.trim();

  const shortKeyword =
    keyword.length > 40 ? `${keyword.slice(0, 40)}…` : keyword;

  return {
    name: shortKeyword ? `Remember: ${shortKeyword}` : "New rule",
    match_field: "both",
    match_type: "contains",
    keyword,
    category_id: form.category_id,
    hmrc_category_id: form.hmrc_category_id,
    is_business: form.is_business ? true : null,
    priority: 10,
    is_active: true,
  };
}
