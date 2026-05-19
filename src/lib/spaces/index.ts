export {
  createHouseholdSpace,
  createHouseholdSpaceForm,
  setActiveSpace,
} from "@/lib/spaces/actions";
export { ACTIVE_SPACE_COOKIE } from "@/lib/spaces/constants";
export {
  canManageSpace,
  ensurePersonalSpace,
  getActiveSpaceContext,
  getUserSpaces,
} from "@/lib/spaces/queries";
export type {
  ActiveSpaceContext,
  SpaceMemberRole,
  SpaceMemberStatus,
  SpaceRow,
  UserSpace,
} from "@/lib/spaces/types";
export {
  isSharedSpaceType,
  spaceSwitcherLabel,
} from "@/lib/spaces/types";
