const AMBIGUOUS_PATTERNS = [
  "AMAZON",
  "AMZN",
  "PAYPAL",
  "EBAY",
  "TESCO",
  "SAINSBURY",
  "ASDA",
  "MORRISONS",
  "ALDI",
  "LIDL",
  "TRANSFER",
  "FASTER PAYMENT",
  "BANK TRANSFER",
  "CARD PAYMENT",
  "SUMUP",
  "STRIPE",
  "GOCARDLESS",
  "REVOLUT",
  "WISE",
  "MONZO",
  "STARLING",
];

export function isAmbiguousMerchant(
  groupKey: string,
  merchantLabel: string
): boolean {
  const haystack = `${groupKey} ${merchantLabel}`.toUpperCase();
  return AMBIGUOUS_PATTERNS.some((pattern) => haystack.includes(pattern));
}

export function merchantDisplayName(merchantLabel: string): string {
  const trimmed = merchantLabel.trim();
  if (trimmed.length <= 28) return trimmed;
  return `${trimmed.slice(0, 28)}…`;
}
