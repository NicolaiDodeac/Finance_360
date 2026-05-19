"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CategoryRow } from "@/lib/categories/queries";
import {
  getCategoryOptionLabel,
  getSelectableCategories,
} from "@/lib/categories/display";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import {
  formatDateRangeChipLabel,
  parseIsoDateParam,
} from "@/lib/transactions/date-range";
import { UNCATEGORIZED_CATEGORY_FILTER } from "@/lib/transactions/links";
import type { BusinessScopeFilter } from "@/lib/transactions/types";
import type { TransactionDirection } from "@/types/database";

interface TransactionFiltersProps {
  categories: CategoryRow[];
  taxYears: TaxYearRow[];
}

type DirectionFilter = TransactionDirection | "all";

export function TransactionFilters({
  categories,
  taxYears,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const direction = (searchParams.get("direction") ?? "all") as DirectionFilter;
  const scope = (searchParams.get("scope") ?? "all") as BusinessScopeFilter;
  const categoryId = searchParams.get("category") ?? "";
  const taxYearId = searchParams.get("taxYear") ?? "";
  const from = parseIsoDateParam(searchParams.get("from") ?? undefined);
  const to = parseIsoDateParam(searchParams.get("to") ?? undefined);

  const applyParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (search.trim() === current.trim()) return;
      applyParams({ q: search.trim() || null });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, searchParams, applyParams]);

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 ${isPending ? "opacity-70" : ""}`}
    >
      <div className="space-y-4">
        <FilterField label="Search" id="tx-search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tx-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Description or merchant"
              className="pl-9"
            />
          </div>
        </FilterField>

        {from && to ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 pr-1">
              <span>{formatDateRangeChipLabel(from, to)}</span>
              <button
                type="button"
                onClick={() => applyParams({ from: null, to: null })}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear date range"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Direction" id="tx-direction">
            <Select
              id="tx-direction"
              value={direction}
              onChange={(e) =>
                applyParams({
                  direction: e.target.value === "all" ? null : e.target.value,
                })
              }
            >
              <option value="all">All directions</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </Select>
          </FilterField>

          <FilterField label="Type" id="tx-scope">
            <Select
              id="tx-scope"
              value={scope}
              onChange={(e) =>
                applyParams({
                  scope: e.target.value === "all" ? null : e.target.value,
                })
              }
            >
              <option value="all">All</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </Select>
          </FilterField>

          <FilterField label="Category" id="tx-category">
            <Select
              id="tx-category"
              value={categoryId}
              onChange={(e) =>
                applyParams({ category: e.target.value || null })
              }
            >
              <option value="">All categories</option>
              <option value={UNCATEGORIZED_CATEGORY_FILTER}>Uncategorized</option>
              {getSelectableCategories(categories).map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryOptionLabel(category, categories)}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Tax year" id="tx-tax-year">
            <Select
              id="tx-tax-year"
              value={taxYearId}
              onChange={(e) =>
                applyParams({ taxYear: e.target.value || null })
              }
            >
              <option value="">All tax years</option>
              {taxYears.map((taxYear) => (
                <option key={taxYear.id} value={taxYear.id}>
                  {taxYear.label}
                </option>
              ))}
            </Select>
          </FilterField>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
