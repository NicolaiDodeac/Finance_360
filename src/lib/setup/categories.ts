import { createClient } from "@/lib/supabase/server";
import type { ServerSupabaseClient } from "@/lib/supabase/types";
import type { CategoryRow } from "@/lib/categories/queries";
import {
  DEFAULT_CATEGORY_CHILDREN,
  DEFAULT_CATEGORY_PARENTS,
} from "@/lib/setup/defaults";

function isDuplicateKeyError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23505" ||
    (error.message?.includes("duplicate key") ?? false)
  );
}

async function getExistingSlugs(
  userId: string,
  supabase: ServerSupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("categories")
    .select("slug")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.slug));
}

async function insertCategoriesIgnoringDuplicates(
  rows: {
    user_id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    sort_order: number;
  }[],
  supabase: ServerSupabaseClient
): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabase.from("categories").insert(rows);

  if (!error) return;

  if (!isDuplicateKeyError(error)) {
    throw new Error(error.message);
  }

  for (const row of rows) {
    const { error: rowError } = await supabase.from("categories").insert(row);
    if (rowError && !isDuplicateKeyError(rowError)) {
      throw new Error(rowError.message);
    }
  }
}

/** Ensures default parent/child categories exist. Safe to call repeatedly. */
export async function ensureDefaultCategories(
  userId: string,
  supabase?: ServerSupabaseClient
): Promise<CategoryRow[]> {
  const client = supabase ?? (await createClient());
  let existingSlugs = await getExistingSlugs(userId, client);

  const parentsToInsert = DEFAULT_CATEGORY_PARENTS.filter(
    (parent) => !existingSlugs.has(parent.slug)
  );

  if (parentsToInsert.length > 0) {
    await insertCategoriesIgnoringDuplicates(
      parentsToInsert.map((parent) => ({
        user_id: userId,
        name: parent.name,
        slug: parent.slug,
        parent_id: null,
        sort_order: parent.sort_order,
      })),
      client
    );
  }

  existingSlugs = await getExistingSlugs(userId, client);

  const { data: parents, error: parentsError } = await client
    .from("categories")
    .select("id, slug")
    .eq("user_id", userId)
    .in(
      "slug",
      DEFAULT_CATEGORY_PARENTS.map((p) => p.slug)
    );

  if (parentsError) {
    throw new Error(parentsError.message);
  }

  const parentIdBySlug = new Map(
    (parents ?? []).map((row) => [row.slug, row.id])
  );

  const childrenToInsert = DEFAULT_CATEGORY_CHILDREN.filter(
    (child) => !existingSlugs.has(child.slug)
  ).flatMap((child) => {
    const parentId = parentIdBySlug.get(child.parent_slug);
    if (!parentId) {
      return [];
    }
    return [
      {
        user_id: userId,
        name: child.name,
        slug: child.slug,
        parent_id: parentId,
        sort_order: child.sort_order,
      },
    ];
  });

  if (childrenToInsert.length > 0) {
    await insertCategoriesIgnoringDuplicates(childrenToInsert, client);
  }

  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
