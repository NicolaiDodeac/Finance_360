import type { PlainChoice } from "@/lib/categorization/categorise-flow/types";

export function filterChoicesByQuery(
  choices: PlainChoice[],
  query: string
): PlainChoice[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return choices;

  return choices.filter((choice) => matchesChoiceQuery(choice, normalized));
}

function matchesChoiceQuery(choice: PlainChoice, query: string): boolean {
  if (choice.label.toLowerCase().includes(query)) {
    return true;
  }
  return (choice.keywords ?? []).some((keyword) =>
    keyword.toLowerCase().includes(query)
  );
}
