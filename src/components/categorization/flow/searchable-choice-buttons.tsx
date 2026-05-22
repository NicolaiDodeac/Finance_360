"use client";

import { useEffect, useMemo, useState } from "react";
import { ChoiceButtons } from "@/components/categorization/flow/choice-buttons";
import { Input } from "@/components/ui/input";
import { filterChoicesByQuery } from "@/lib/categorization/categorise-flow/filter-choices";
import type { PlainChoice } from "@/lib/categorization/categorise-flow";

interface SearchableChoiceButtonsProps {
  choices: PlainChoice[];
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function SearchableChoiceButtons({
  choices,
  selectedId,
  disabled,
  onSelect,
  searchPlaceholder = "Search category…",
  emptyMessage = "No matching category yet. Try another word or choose Other.",
}: SearchableChoiceButtonsProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, [choices]);

  const filteredChoices = useMemo(
    () => filterChoicesByQuery(choices, query),
    [choices, query]
  );

  const showEmpty = query.trim().length > 0 && filteredChoices.length === 0;

  return (
    <div className="space-y-3">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        disabled={disabled}
        className="h-11 text-base"
        autoComplete="off"
        enterKeyHint="search"
      />
      {showEmpty ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ChoiceButtons
          choices={filteredChoices}
          selectedId={selectedId}
          disabled={disabled}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
