import { ruleMatchesTransaction } from "@/lib/categorization/match";
import type {
  CategorizationRuleRow,
  RuleMatchableTransaction,
} from "@/lib/categorization/types";
import type { TransactionDirection } from "@/types/database";

export interface RetroactiveMatchableTransaction extends RuleMatchableTransaction {
  id: string;
  direction: TransactionDirection;
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean;
  raw_import_data?: Record<string, unknown> | null;
}

export interface CategorizationAssignment {
  category_id: string | null;
  hmrc_category_id: string | null;
  is_business: boolean;
}

/** Keyword used for “similar transaction” matching (same as rule form defaults). */
export function inferMatchKeyword(tx: RuleMatchableTransaction): string | null {
  const keyword =
    tx.description?.trim() || tx.merchant_name?.trim() || "";
  return keyword.length > 0 ? keyword : null;
}

function buildSyntheticRule(keyword: string): CategorizationRuleRow {
  const now = new Date().toISOString();
  return {
    id: "__synthetic__",
    user_id: "",
    name: "",
    match_field: "both",
    match_type: "contains",
    match_value: keyword,
    category_id: null,
    hmrc_category_id: null,
    is_business: null,
    priority: 0,
    is_active: true,
    times_matched: 0,
    created_at: now,
    updated_at: now,
  };
}

export function transactionMatchesAnchor(
  anchor: RuleMatchableTransaction,
  candidate: RuleMatchableTransaction
): boolean {
  const keyword = inferMatchKeyword(anchor);
  if (!keyword) {
    return false;
  }
  return ruleMatchesTransaction(buildSyntheticRule(keyword), candidate);
}

export function categorizationChanged(
  before: CategorizationAssignment,
  after: CategorizationAssignment
): boolean {
  return (
    (before.category_id ?? null) !== (after.category_id ?? null) ||
    (before.hmrc_category_id ?? null) !== (after.hmrc_category_id ?? null) ||
    before.is_business !== after.is_business
  );
}

export function hasCategorizationToApply(assignment: CategorizationAssignment): boolean {
  return Boolean(assignment.category_id || assignment.hmrc_category_id);
}

/** Whether a similar row should receive the new categorization. */
export function shouldRetroactivelyUpdate(
  candidate: RetroactiveMatchableTransaction,
  anchorId: string,
  anchor: RuleMatchableTransaction & { direction: TransactionDirection },
  before: CategorizationAssignment,
  after: CategorizationAssignment
): boolean {
  if (candidate.id === anchorId) {
    return false;
  }
  if (candidate.direction !== anchor.direction) {
    return false;
  }
  if (!transactionMatchesAnchor(anchor, candidate)) {
    return false;
  }

  const alreadyApplied =
    (candidate.category_id ?? null) === (after.category_id ?? null) &&
    (candidate.hmrc_category_id ?? null) === (after.hmrc_category_id ?? null) &&
    candidate.is_business === after.is_business;

  if (alreadyApplied) {
    return false;
  }

  const uncategorized =
    !candidate.category_id && !candidate.hmrc_category_id;
  const hadSameAsBefore =
    (candidate.category_id ?? null) === (before.category_id ?? null) &&
    (candidate.hmrc_category_id ?? null) === (before.hmrc_category_id ?? null) &&
    candidate.is_business === before.is_business;

  return uncategorized || hadSameAsBefore;
}

export function filterRetroactiveTargets(
  rows: RetroactiveMatchableTransaction[],
  anchorId: string,
  anchor: RuleMatchableTransaction & { direction: TransactionDirection },
  before: CategorizationAssignment,
  after: CategorizationAssignment
): RetroactiveMatchableTransaction[] {
  return rows.filter((row) =>
    shouldRetroactivelyUpdate(row, anchorId, anchor, before, after)
  );
}
