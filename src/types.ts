/**
 * Shared types for backend and frontend (Entities, DTOs, Commands)
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * derived from the database schema and API specifications.
 */

import type { Tables, TablesInsert, Enums } from "./db/database.types";

// ============================================================================
// Base Entity Types (from database)
// ============================================================================

export type Profile = Tables<"profiles">;
export type Group = Tables<"groups">;
export type GroupMember = Tables<"group_members">;
export type Currency = Tables<"currencies">;
export type GroupCurrency = Tables<"group_currencies">;
export type Invitation = Tables<"invitations">;
export type Expense = Tables<"expenses">;
export type ExpenseSplit = Tables<"expense_splits">;
export type Settlement = Tables<"settlements">;

export type GroupRole = Enums<"group_role">;
export type GroupMemberStatus = Enums<"group_member_status">;
export type GroupStatus = Enums<"group_status">;
export type InvitationStatus = Enums<"invitation_status">;

// ============================================================================
// Common Utility Types
// ============================================================================

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Minimal user information used across various DTOs
 */
export interface UserInfoDTO {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * User information with email
 */
export type UserInfoWithEmailDTO = UserInfoDTO & {
  email: string;
};

// ============================================================================
// Profile DTOs
// ============================================================================

/**
 * Profile data transfer object
 * Used in: GET /api/profiles/me
 */
export type ProfileDTO = Profile;

// ============================================================================
// Group DTOs and Commands
// ============================================================================

/**
 * Lightweight member summary for list views
 * Used in API responses, but simplified for frontend
 */
export interface GroupMemberSummaryDTO {
  profile_id: string;
  full_name: string | null;
  avatar_url: string | null;
  status: GroupMemberStatus;
  role: GroupRole;
}

/**
 * Group list item with computed fields
 * Used in: GET /api/groups (array items)
 */
export type GroupListItemDTO = Group & {
  /** User's role in this group */
  role: GroupRole;
  /** User's balance in base currency (positive = owed to user, negative = user owes) */
  my_balance: number;
  /** All active members for avatar slider (full list, frontend calculates count from members.length) */
  members: GroupMemberSummaryDTO[];
};

/**
 * Create group command
 * Used in: POST /api/groups (request body)
 */
export type CreateGroupCommand = Pick<TablesInsert<"groups">, "name" | "base_currency_code"> & {
  /** Optional array of email addresses to invite (max 20) */
  invite_emails?: string[];
};

/**
 * Member info for invitation results
 */
export interface AddedMemberDTO {
  profile_id: string;
  email: string;
  full_name: string | null;
  status: GroupMemberStatus;
}

/**
 * Created invitation info
 */
export interface CreatedInvitationDTO {
  id: string;
  email: string;
  status: InvitationStatus;
}

/**
 * Invitation processing results
 */
export interface InvitationResultDTO {
  added_members: AddedMemberDTO[];
  created_invitations: CreatedInvitationDTO[];
}

/**
 * Create group response
 * Used in: POST /api/groups (response)
 */
export type CreateGroupResponseDTO = Group & {
  role: GroupRole;
  invitations: InvitationResultDTO;
};

/**
 * Group member with profile information
 * Used in: GET /api/groups/:id
 */
export interface GroupMemberDTO {
  profile_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: GroupRole;
  status: GroupMemberStatus;
  joined_at: string;
}

/**
 * Pending invitation information
 * Used in: GET /api/groups/:id
 */
export type PendingInvitationDTO = Pick<Invitation, "id" | "email" | "status" | "created_at">;

/**
 * Detailed group information with members
 * Used in: GET /api/groups/:id
 */
export type GroupDetailDTO = Group & {
  my_role: GroupRole;
  members: GroupMemberDTO[];
  group_currencies: GroupCurrencyDTO[];
  pending_invitations: PendingInvitationDTO[];
};

/**
 * Update group command
 * Used in: PATCH /api/groups/:id
 */
export interface UpdateGroupCommand {
  name: string;
}

/**
 * Invite members command
 * Used in: POST /api/groups/:groupId/members/invite
 */
export interface InviteMembersCommand {
  /** Array of email addresses (min 1, max 20) */
  emails: string[];
}

/**
 * Invite members response
 * Used in: POST /api/groups/:groupId/members/invite
 */
export type InviteMembersResponseDTO = InvitationResultDTO;

// ============================================================================
// Currency DTOs and Commands
// ============================================================================

/**
 * Currency data transfer object
 * Used in: GET /api/currencies
 */
export type CurrencyDTO = Currency;

/**
 * Group currency with exchange rate
 * Used in: GET /api/groups/:groupId/currencies
 */
export type GroupCurrencyDTO = Currency & {
  exchange_rate: number;
};

/**
 * Group currencies response
 * Used in: GET /api/groups/:groupId/currencies
 */
export interface GroupCurrenciesDTO {
  base_currency: GroupCurrencyDTO;
  additional_currencies: GroupCurrencyDTO[];
}

/**
 * Add currency to group command
 * Used in: POST /api/groups/:groupId/currencies
 */
export type AddCurrencyCommand = Pick<TablesInsert<"group_currencies">, "exchange_rate"> & {
  currency_code: string;
};

/**
 * Update currency exchange rate command
 * Used in: PATCH /api/groups/:groupId/currencies/:code
 */
export interface UpdateCurrencyCommand {
  exchange_rate: number;
}

// ============================================================================
// Expense DTOs and Commands
// ============================================================================

/**
 * Expense split for command (without expense_id)
 * Used in: POST /api/groups/:groupId/expenses, PATCH /api/expenses/:id
 */
export interface ExpenseSplitCommand {
  profile_id: string;
  amount: number;
}

/**
 * Expense split with participant information
 * Used in expense DTOs
 */
export interface ExpenseSplitDTO {
  profile_id: string;
  full_name: string | null;
  amount: number;
}

/**
 * Create expense command
 * Used in: POST /api/groups/:groupId/expenses
 */
export interface CreateExpenseCommand {
  description: string;
  amount: number;
  currency_code: string;
  expense_date: string;
  payer_id: string;
  splits: ExpenseSplitCommand[];
}

/**
 * Update expense command
 * Used in: PATCH /api/expenses/:id
 */
export type UpdateExpenseCommand = CreateExpenseCommand;

/**
 * Expense data transfer object
 * Used in: POST /api/groups/:groupId/expenses, GET /api/groups/:groupId/expenses
 */
export type ExpenseDTO = Omit<Expense, "created_by"> & {
  /** Amount converted to group's base currency */
  amount_in_base_currency: number;
  /** Expense creator information */
  created_by: UserInfoDTO;
  /** Expense splits with participant names */
  splits: ExpenseSplitDTO[];
};

/**
 * Expense list item
 * Used in: GET /api/groups/:groupId/expenses (array items)
 */
export type ExpenseListItemDTO = ExpenseDTO;

/**
 * Detailed expense information with payer
 * Used in: GET /api/expenses/:id
 */
export type ExpenseDetailDTO = ExpenseDTO & {
  payer: {
    id: string;
    full_name: string | null;
  };
};

/**
 * Expense transcription result from AI
 * Used when AI extracts expense data from audio transcription
 */
export interface ExpenseTranscriptionResult {
  description: string;
  amount: number;
  currency_code?: string | null;
  expense_date?: string | null;
  payer_id?: string | null;
  splits: {
    profile_id: string;
    amount: number;
  }[];
  extraction_confidence?: number;
}

/**
 * Transcription result from AI
 */
export interface TranscriptionResultDTO {
  transcription: string;
  expense_data: ExpenseTranscriptionResult;
  confidence: number;
}

/**
 * Transcription error details
 */
export interface TranscriptionErrorDTO {
  code: string;
  message: string;
}

/**
 * Transcription task status
 * Used in: GET /api/expenses/transcribe/:taskId
 */
export interface TranscribeTaskStatusDTO {
  task_id: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  result?: TranscriptionResultDTO;
  error?: TranscriptionErrorDTO;
}

/**
 * Transcribe audio task response
 * Used in: POST /api/expenses/transcribe
 */
export type TranscribeTaskResponseDTO = Pick<TranscribeTaskStatusDTO, "task_id" | "status" | "created_at">;

// ============================================================================
// Settlement DTOs and Commands
// ============================================================================

/**
 * User information for settlements
 */
export type SettlementUserDTO = UserInfoDTO;

/**
 * Settlement data transfer object
 * Used in: GET /api/groups/:groupId/settlements, POST /api/groups/:groupId/settlements
 */
export type SettlementDTO = Omit<Settlement, "payer_id" | "payee_id"> & {
  payer: SettlementUserDTO;
  payee: SettlementUserDTO;
};

/**
 * Create settlement command
 * Used in: POST /api/groups/:groupId/settlements
 */
export type CreateSettlementCommand = Pick<TablesInsert<"settlements">, "payer_id" | "payee_id" | "amount">;

// ============================================================================
// Balance DTOs
// ============================================================================

/**
 * Member balance information
 * Used in: GET /api/groups/:groupId/balances
 */
export interface MemberBalanceDTO {
  profile_id: string;
  full_name: string | null;
  avatar_url: string | null;
  balance: number;
  status: GroupMemberStatus;
}

/**
 * Suggested settlement to minimize transactions
 * Used in: GET /api/groups/:groupId/balances
 */
export interface SuggestedSettlementDTO {
  from: {
    profile_id: string;
    full_name: string | null;
  };
  to: {
    profile_id: string;
    full_name: string | null;
  };
  amount: number;
}

/**
 * Group balances with settlement suggestions
 * Used in: GET /api/groups/:groupId/balances
 */
export interface BalancesDTO {
  group_id: string;
  base_currency_code: string;
  calculated_at: string;
  member_balances: MemberBalanceDTO[];
  suggested_settlements: SuggestedSettlementDTO[];
}

// ============================================================================
// Invitation DTOs
// ============================================================================

/**
 * Invitation with group information
 * Used in: GET /api/invitations
 */
export type InvitationDTO = Omit<Invitation, "group_id"> & {
  group: {
    id: string;
    name: string;
  };
};

/**
 * Accept invitation response
 * Used in: POST /api/invitations/:id/accept
 */
export interface AcceptInvitationResponseDTO {
  message: string;
  invitation_id: string;
  group_id: string;
  group_name: string;
}

/**
 * Decline invitation response
 * Used in: POST /api/invitations/:id/decline
 */
export interface DeclineInvitationResponseDTO {
  message: string;
  invitation_id: string;
}

// ============================================================================
// Common Response Types
// ============================================================================

/**
 * Generic success message response
 */
export interface MessageResponseDTO {
  message: string;
}

/**
 * Error response structure
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * Login credentials
 * Used in: LoginForm component
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup credentials
 * Used in: SignupForm component
 */
export interface SignupCredentials {
  full_name: string; // Nazwa użytkownika - może być login, pseudonim, itp.
  email: string;
  password: string;
  confirm_password: string;
}

/**
 * Password reset request
 * Used in: ResetPasswordForm component
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Set new password
 * Used in: ResetPasswordForm component
 */
export interface SetNewPassword {
  new_password: string;
  confirm_password: string;
}

/**
 * Authenticated user info with profile data
 * Passed as props to components from SSR
 */
export interface AuthUserWithProfile {
  id: string;
  email: string;
  full_name: string | null; // Nazwa użytkownika (login, pseudonim, itp.)
  avatar_url: string | null;
}

/**
 * Update user attributes for Supabase auth
 */
export interface UpdateUserAttributes {
  password?: string;
  email?: string;
  data?: Record<string, unknown>;
}

/**
 * Generic API error structure
 */
export interface ApiError {
  code?: string;
  message?: string;
}

/**
 * OpenRouter API response structure
 */
export interface OpenRouterApiResponse {
  choices: {
    message: {
      tool_calls?: {
        function: {
          arguments: string;
        };
      }[];
    };
  }[];
}

/**
 * Whisper API transcription response structure
 */
export interface WhisperTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcription result structure
 */
export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}
