import type { Database } from "@/types/database";

export type RuleMatchField = Database["public"]["Enums"]["rule_match_field"];
export type RuleMatchType = Database["public"]["Enums"]["rule_match_type"];

export type CategorizationRuleRow =
  Database["public"]["Tables"]["categorization_rules"]["Row"];

export interface RuleMatchableTransaction {
  description: string | null;
  merchant_name: string | null;
}

export interface RuleApplication {
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean | null;
  matched_rule: CategorizationRuleRow | null;
}

export interface CategorizationRuleFormInput {
  name: string;
  match_field: RuleMatchField;
  match_type: RuleMatchType;
  /** Stored as match_value in the database. */
  keyword: string;
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean | null;
  priority: number;
  is_active: boolean;
}

export interface CategorizationMetadata {
  rule_id: string;
  rule_name: string;
  applied_at: string;
}
