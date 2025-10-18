/**
 * Dashboard View Models
 * These types are used for presentation layer, mapped from DTOs
 */

import type { GroupRole, GroupMemberStatus } from '@/types';

export type AvatarVM = {
  profileId: string;
  fullName: string | null;
  avatarUrl: string | null;
  isCreator?: boolean;
};

export type GroupCardVM = {
  id: string;
  name: string;
  baseCurrencyCode: string;
  role: GroupRole;
  memberCount: number;
  myBalance: number; // in base currency
  avatars: AvatarVM[];
  creatorProfileId?: string; // Profile ID of the group creator
};

export type InvitationCardVM = {
  id: string;
  groupId: string;
  groupName: string;
  createdAt?: string;
  invitedByName?: string | null;
};

export type GroupsQueryState = {
  data: GroupCardVM[];
  total: number;
  limit: number;
  offset: number;
  loading: boolean;
  error: string | null;
};

export type InvitationsQueryState = {
  data: InvitationCardVM[];
  loading: boolean;
  error: string | null;
};

export type DashboardViewState = {
  hasAnyGroups: boolean;
  hasAnyInvitations: boolean;
};

