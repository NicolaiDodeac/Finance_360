"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/helpers";
import { ACTIVE_SPACE_COOKIE } from "@/lib/spaces/constants";
import { ensurePersonalSpace, getUserSpaces } from "@/lib/spaces/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/transactions/types";

export async function setActiveSpace(spaceId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const spaces = await getUserSpaces(user.id);
  const match = spaces.find((s) => s.id === spaceId);

  if (!match) {
    return { success: false, error: "You do not have access to that space." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SPACE_COOKIE, spaceId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/goals");

  return { success: true };
}

export async function createHouseholdSpace(
  formData: FormData
): Promise<ActionResult & { spaceId?: string }> {
  const user = await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const invitedEmail = String(formData.get("invited_email") ?? "")
    .trim()
    .toLowerCase();

  if (!name) {
    return { success: false, error: "Please enter a name for your shared space." };
  }

  const supabase = await createClient();

  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .insert({
      name,
      type: "household",
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (spaceError || !space) {
    return {
      success: false,
      error: spaceError?.message ?? "Could not create shared space.",
    };
  }

  const { error: memberError } = await supabase.from("space_members").insert({
    space_id: space.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  if (invitedEmail) {
    const { error: inviteError } = await supabase.from("space_members").insert({
      space_id: space.id,
      role: "member",
      status: "invited",
      invited_email: invitedEmail,
    });

    if (inviteError) {
      return { success: false, error: inviteError.message };
    }
  }

  await ensurePersonalSpace(user.id);

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SPACE_COOKIE, space.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/goals");

  return { success: true, spaceId: space.id };
}

/** Form-friendly wrapper for create household space page. */
export async function createHouseholdSpaceForm(formData: FormData): Promise<void> {
  await createHouseholdSpace(formData);
}
