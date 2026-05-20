import {
  canonicalMerchantGroupKey,
  strictMerchantGroupKey,
} from "@/lib/categorization/merchant-canonical";

/** @deprecated Prefer strictMerchantGroupKey or canonicalMerchantGroupKey */
export function normalizeMerchantGroupKey(
  description: string | null,
  merchant_name: string | null
): string {
  return strictMerchantGroupKey(description, merchant_name);
}

export { canonicalMerchantGroupKey, strictMerchantGroupKey };

/** Human-readable label for a group (title case from normalized key). */
export function merchantGroupDisplayLabel(groupKey: string): string {
  if (!groupKey) {
    return "Unknown";
  }
  return groupKey
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/** Keyword for categorisation rules (contains match). */
export function inferGroupMatchKeyword(
  description: string | null,
  merchant_name: string | null
): string {
  const keyword = merchant_name?.trim() || description?.trim() || "";
  return keyword.length > 0 ? keyword : "";
}

/** Rule keyword for a merged merchant family (broader contains match). */
export function inferCanonicalMatchKeyword(canonicalKey: string): string {
  if (!canonicalKey) return "";
  return merchantGroupDisplayLabel(canonicalKey);
}
