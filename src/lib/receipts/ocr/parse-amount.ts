/** Parse UK/EU money strings: 16.40, 16,40, £16.40, 1,234.56 */
export function parseMoneyAmount(raw: string): number | null {
  let cleaned = raw.trim().replace(/[£$€\s]/g, "");
  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = `${parts[0]}.${parts[1]}`;
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}
