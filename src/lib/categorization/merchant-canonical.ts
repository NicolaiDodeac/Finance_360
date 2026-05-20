/**
 * Canonical merchant keys merge variants (e.g. Amazon + trailing reference numbers)
 * for categorisation grouping. Strict keys remain available for split views.
 */

/** First-token families merged into one canonical bucket. */
const MERCHANT_FAMILY_PREFIXES: { prefixes: string[]; canonical: string }[] = [
  { prefixes: ["AMAZON", "AMZN"], canonical: "AMAZON" },
  { prefixes: ["PAYPAL"], canonical: "PAYPAL" },
  { prefixes: ["EBAY"], canonical: "EBAY" },
  { prefixes: ["SUMUP"], canonical: "SUMUP" },
  { prefixes: ["STRIPE"], canonical: "STRIPE" },
  { prefixes: ["GOCARDLESS"], canonical: "GOCARDLESS" },
];

function stripTrailingNoise(key: string): string {
  let k = key;
  k = k.replace(/\*[\dA-Z]+$/g, "");
  k = k.replace(/\s+#\d+$/g, "");
  k = k.replace(/\s+\d{4,}([A-Z0-9]{2,8})?$/g, "");
  k = k.replace(/\s+\d{2,10}$/g, "");
  return k.replace(/\s+/g, " ").trim();
}

function resolveMerchantFamily(key: string): string {
  const first = key.split(" ")[0] ?? key;
  for (const { prefixes, canonical } of MERCHANT_FAMILY_PREFIXES) {
    if (prefixes.some((p) => first === p || first.startsWith(p))) {
      return canonical;
    }
  }
  return key;
}

/** Strict normalized key (one row of bank text, numbers kept). */
export function strictMerchantGroupKey(
  description: string | null,
  merchant_name: string | null
): string {
  const raw = merchant_name?.trim() || description?.trim() || "";
  if (!raw) return "";
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Canonical key used to merge similar merchants (Amazon variants, etc.). */
export function canonicalMerchantGroupKey(
  description: string | null,
  merchant_name: string | null
): string {
  const strict = strictMerchantGroupKey(description, merchant_name);
  if (!strict) return "";
  const stripped = stripTrailingNoise(strict);
  if (!stripped) return strict;
  return resolveMerchantFamily(stripped);
}

export function isCombinedMerchantGroup(strictKeys: string[]): boolean {
  if (strictKeys.length <= 1) return false;
  const canonical = new Set(
    strictKeys.map((k) => {
      const stripped = stripTrailingNoise(k);
      return resolveMerchantFamily(stripped || k);
    })
  );
  return canonical.size === 1;
}
