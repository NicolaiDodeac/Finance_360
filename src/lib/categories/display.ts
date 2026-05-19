import type { CategoryRow } from "@/lib/categories/queries";

/** Leaf categories only (excludes parent groupings like Income / Expenses). */
export function getSelectableCategories(categories: CategoryRow[]): CategoryRow[] {
  return categories.filter((category) => category.parent_id !== null);
}

export function getCategoryOptionLabel(
  category: CategoryRow,
  categories: CategoryRow[]
): string {
  if (!category.parent_id) {
    return category.name;
  }

  const parent = categories.find((c) => c.id === category.parent_id);
  return parent ? `${parent.name} / ${category.name}` : category.name;
}
