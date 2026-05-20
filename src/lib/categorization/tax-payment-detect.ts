/**
 * Deterministic HMRC / tax payment text detection (uppercase-normalised keys).
 * Used for categorisation suggestions only — not a guarantee of tax liability.
 */
export function looksLikeTaxPayment(text: string): boolean {
  const key = text.toUpperCase().replace(/\s+/g, " ").trim();
  if (!key) return false;

  if (key.includes("HMRC")) {
    return true;
  }

  if (key.includes("PAYMENT ON ACCOUNT")) {
    return true;
  }

  if (
    key.includes("SELF ASSESSMENT") &&
    (key.includes("HMRC") || key.includes("TAX") || key.includes("PAYMENT"))
  ) {
    return true;
  }

  if (
    key.includes("HMRC VAT") ||
    key.includes("VAT PAYMENT") ||
    key.includes("VAT RETURN") ||
    key.includes("VAT HMRC")
  ) {
    return true;
  }

  if (key === "VAT" || key.startsWith("VAT ") || key.endsWith(" VAT")) {
    return false;
  }

  return false;
}
