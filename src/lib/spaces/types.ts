import type { Database } from "@/types/database";

export type SpaceType = Database["public"]["Enums"]["space_type"];
export type SpaceMemberRole = Database["public"]["Enums"]["space_member_role"];
export type SpaceMemberStatus = Database["public"]["Enums"]["space_member_status"];

export type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];
export type SpaceMemberRow = Database["public"]["Tables"]["space_members"]["Row"];

export interface UserSpace {
  id: string;
  name: string;
  type: SpaceType;
  role: SpaceMemberRole;
  canManage: boolean;
}

export interface ActiveSpaceContext {
  space: UserSpace;
  isShared: boolean;
}

export function isSharedSpaceType(type: SpaceType): boolean {
  return type === "household" || type === "business";
}

export function spaceSwitcherLabel(space: UserSpace): string {
  if (space.type === "personal") return "Personal";
  return space.name;
}
