import { findTaxYearForDate } from "@/lib/tax-years/queries";
import type { TaxYearRow } from "@/lib/tax-years/queries";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Picks the tax year to show by default (current flag, then calendar match, then latest). */
export function resolveDefaultTaxYear(
  taxYears: TaxYearRow[]
): TaxYearRow | undefined {
  if (taxYears.length === 0) return undefined;

  const flagged = taxYears.find((ty) => ty.is_current);
  if (flagged) return flagged;

  const byDate = findTaxYearForDate(taxYears, todayIsoDate());
  if (byDate) return byDate;

  return taxYears[0];
}

export function resolveSelectedTaxYear(
  taxYears: TaxYearRow[],
  taxYearId?: string
): TaxYearRow | null {
  if (taxYears.length === 0) return null;

  if (taxYearId) {
    const match = taxYears.find((ty) => ty.id === taxYearId);
    if (match) return match;
  }

  return resolveDefaultTaxYear(taxYears) ?? null;
}
