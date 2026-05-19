"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { TaxYearRow } from "@/lib/tax-years/queries";

interface TaxYearSelectorProps {
  taxYears: TaxYearRow[];
  selectedTaxYearId: string;
}

export function TaxYearSelector({
  taxYears,
  selectedTaxYearId,
}: TaxYearSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const applyTaxYear = useCallback(
    (taxYearId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (taxYearId) {
        params.set("taxYear", taxYearId);
      } else {
        params.delete("taxYear");
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className={isPending ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <div className="flex min-w-0 flex-col gap-2 sm:max-w-xs">
        <Label
          htmlFor="tax-year"
          className="text-xs font-medium text-muted-foreground"
        >
          Tax year
        </Label>
        <Select
          id="tax-year"
          value={selectedTaxYearId}
          onChange={(e) => applyTaxYear(e.target.value)}
        >
          {taxYears.map((taxYear) => (
            <option key={taxYear.id} value={taxYear.id}>
              {taxYear.label}
              {taxYear.is_current ? " (current)" : ""}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}