import type { FlowType } from "@/lib/transactions/flow-type";

export interface AssistantTransactionMetadata {
  review_recommended?: boolean;
  review_marked_at?: string;
  evidence_recommendation?: string;
  purpose?: string;
  /** How money moved — drives lifestyle vs savings vs debt analytics. */
  flow_type?: FlowType;
  /** Expense category choice or income type id. */
  category_choice?: string;
  income_type?: string;
  rule_scope?: string;
  counts_as_turnover?: boolean;
  exclude_from_income?: boolean;
  exclude_from_spending?: boolean;
}

const ASSISTANT_KEY = "assistant";

export function getAssistantMetadata(
  raw: Record<string, unknown> | null | undefined
): AssistantTransactionMetadata | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const value = raw[ASSISTANT_KEY];
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as AssistantTransactionMetadata;
}

export function isReviewRecommended(
  raw: Record<string, unknown> | null | undefined
): boolean {
  return getAssistantMetadata(raw)?.review_recommended === true;
}

export function mergeAssistantMetadata(
  raw: Record<string, unknown> | null | undefined,
  patch: AssistantTransactionMetadata
): Record<string, unknown> {
  const base = { ...(raw ?? {}) };
  const existing = getAssistantMetadata(base) ?? {};
  base[ASSISTANT_KEY] = { ...existing, ...patch };
  return base;
}
