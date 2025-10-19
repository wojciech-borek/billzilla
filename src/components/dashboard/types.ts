/**
 * Dashboard View Models
 * These types are used for presentation layer, mapped from DTOs
 */

import type { GroupRole, GroupMemberStatus } from "@/types";

export interface AvatarVM {
  profileId: string;
  fullName: string | null;
  avatarUrl: string | null;
  isCreator?: boolean;
}

export interface GroupCardVM {
  id: string;
  name: string;
  baseCurrencyCode: string;
  role: GroupRole;
  memberCount: number;
  myBalance: number; // in base currency
  avatars: AvatarVM[];
  creatorProfileId?: string; // Profile ID of the group creator
}

export interface InvitationCardVM {
  id: string;
  groupId: string;
  groupName: string;
  createdAt?: string;
  invitedByName?: string | null;
}

export interface GroupsQueryState {
  data: GroupCardVM[];
  total: number;
  limit: number;
  offset: number;
  loading: boolean;
  error: string | null;
}

export interface InvitationsQueryState {
  data: InvitationCardVM[];
  loading: boolean;
  error: string | null;
}

export interface DashboardViewState {
  hasAnyGroups: boolean;
  hasAnyInvitations: boolean;
}
