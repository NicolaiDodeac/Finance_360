import { cookies } from "next/headers";
import { ACTIVE_SPACE_COOKIE } from "@/lib/spaces/constants";
import type {
  ActiveSpaceContext,
  SpaceMemberRole,
  UserSpace,
} from "@/lib/spaces/types";
import { isSharedSpaceType } from "@/lib/spaces/types";
import { createClient } from "@/lib/supabase/server";

interface SpaceMemberJoinRow {
  role: SpaceMemberRole;
  spaces: {
    id: string;
    name: string;
    type: UserSpace["type"];
    owner_id: string;
  };
}

export async function ensurePersonalSpace(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ensure_personal_space", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export async function getUserSpaces(userId: string): Promise<UserSpace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("space_members")
    .select(
      `
      role,
      spaces (
        id,
        name,
        type,
        owner_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SpaceMemberJoinRow[];
  const spaces: UserSpace[] = rows
    .filter((row) => row.spaces)
    .map((row) => ({
      id: row.spaces.id,
      name: row.spaces.name,
      type: row.spaces.type,
      role: row.role,
      canManage: row.role === "owner" || row.role === "admin",
    }));

  return spaces.sort((a, b) => {
    if (a.type === "personal") return -1;
    if (b.type === "personal") return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getActiveSpaceContext(
  userId: string
): Promise<ActiveSpaceContext> {
  await ensurePersonalSpace(userId);
  const spaces = await getUserSpaces(userId);
  const cookieStore = await cookies();
  const cookieSpaceId = cookieStore.get(ACTIVE_SPACE_COOKIE)?.value;

  const personal = spaces.find((s) => s.type === "personal");
  if (!personal) {
    throw new Error("Personal space not found.");
  }

  const active =
    spaces.find((s) => s.id === cookieSpaceId) ?? personal;

  return {
    space: active,
    isShared: isSharedSpaceType(active.type),
  };
}

export async function canManageSpace(
  userId: string,
  spaceId: string
): Promise<boolean> {
  const spaces = await getUserSpaces(userId);
  const match = spaces.find((s) => s.id === spaceId);
  return match?.canManage ?? false;
}
