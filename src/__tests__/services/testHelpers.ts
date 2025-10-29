import { vi } from "vitest";
import { ExpenseValidationError } from "../../lib/services/expenseService";
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  MockSupabaseClient,
  MockSupabaseQueryBuilder,
  MockResponse,
  MockQueryResult,
  AuthMockSetupConfig,
} from "../testTypes";
import type { Mock } from "vitest";
import type { AuthError } from "@supabase/supabase-js";

export type { MockSupabaseClient };

/**
 * Test Helper Functions
 *
 * This file contains all test helper functions organized by category:
 * - Factory functions for creating test data
 * - Supabase mocking utilities
 * - Service-specific test helpers
 * - Common test setup utilities
 */

// =============================================================================
// FACTORY FUNCTIONS FOR TEST DATA
// =============================================================================
export const createMockCreateGroupCommand = (
  overrides: Partial<{
    name: string;
    base_currency_code: string;
    invite_emails: string[];
  }> = {}
) => ({
  name: "Test Group",
  base_currency_code: "USD",
  invite_emails: ["user1@test.com", "user2@test.com"],
  ...overrides,
});

export const createMockGroupDetail = (
  overrides: Partial<{
    id: string;
    name: string;
    base_currency_code: string;
    status: "active" | "inactive";
    created_at: string;
  }> = {}
) => ({
  id: "group-123",
  name: "Test Group",
  base_currency_code: "USD",
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockGroupMember = (
  overrides: Partial<{
    profile_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: "admin" | "member";
    status: "active" | "inactive";
    joined_at: string;
  }> = {}
) => ({
  profile_id: "user-123",
  full_name: "Test User",
  email: "test@example.com",
  avatar_url: null,
  role: "member" as const,
  status: "active" as const,
  joined_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockGroupCurrency = (
  overrides: Partial<{
    code: string;
    name: string;
    exchange_rate: number;
  }> = {}
) => ({
  code: "USD",
  name: "US Dollar",
  exchange_rate: 1.0,
  ...overrides,
});

export const createMockGroupDetailDTO = (
  overrides: Partial<{
    id: string;
    name: string;
    base_currency_code: string;
    status: "active" | "inactive";
    created_at: string;
    my_role: "admin" | "member";
    members: unknown[];
    group_currencies: unknown[];
    pending_invitations: unknown[];
  }> = {}
) => ({
  id: "group-123",
  name: "Test Group",
  base_currency_code: "USD",
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  my_role: "member" as const,
  members: [createMockGroupMember()],
  group_currencies: [createMockGroupCurrency()],
  pending_invitations: [createMockPendingInvitation()],
  ...overrides,
});

export const createMockPendingInvitation = (
  overrides: Partial<{
    id: string;
    email: string;
    status: "pending" | "accepted" | "declined";
    created_at: string;
  }> = {}
) => ({
  id: "inv-1",
  email: "pending@example.com",
  status: "pending" as const,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockGroupListItem = (
  overrides: Partial<{
    id: string;
    name: string;
    base_currency_code: string;
    status: "active" | "inactive";
    created_at: string;
    role: "admin" | "member";
    my_balance: number;
    members: unknown[];
  }> = {}
) => ({
  id: "group-123",
  name: "Test Group",
  base_currency_code: "USD",
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  role: "member" as const,
  my_balance: 0,
  members: [createMockGroupMember()],
  ...overrides,
});

// =============================================================================
// SUPABASE MOCKING UTILITIES
// =============================================================================
export const createMockSupabaseClient = (): MockSupabaseClient => {
  // Create a base mock that will be cast to MockSupabaseClient
  // Create a proper query builder that chains correctly
  const mockQueryBuilder: MockSupabaseQueryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gt: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    lte: vi.fn(),
    like: vi.fn(),
    ilike: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    contains: vi.fn(),
    containedBy: vi.fn(),
    range: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    rpc: vi.fn(),
    count: vi.fn(),
    head: vi.fn(),
    csv: vi.fn(),
    explain: vi.fn(),
    rollback: vi.fn(),
    abortSignal: vi.fn(),
    or: vi.fn(),
    then: vi.fn(),
    catch: vi.fn(),
    finally: vi.fn(),
  };

  // Set up chaining - all methods return the query builder
  Object.keys(mockQueryBuilder).forEach((key) => {
    const method = mockQueryBuilder[key as keyof MockSupabaseQueryBuilder];
    if (typeof method === "function" && key !== "single" && key !== "maybeSingle" && key !== "rpc") {
      (method as Mock).mockReturnValue(mockQueryBuilder);
    }
  });

  const mockClient = {
    ...mockQueryBuilder,
    from: vi.fn().mockReturnValue(mockQueryBuilder),
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithIdToken: vi.fn(),
      signInAnonymously: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      setSession: vi.fn(),
      refreshSession: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      verifyOtp: vi.fn(),
      resend: vi.fn(),
    },
    channel: vi.fn(),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
    removeAllSubscriptions: vi.fn(),
    getChannels: vi.fn().mockReturnValue([]),
    rest: {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    },
    realtime: {
      channel: vi.fn(),
      removeChannel: vi.fn(),
      removeAllChannels: vi.fn(),
      getChannels: vi.fn().mockReturnValue([]),
    },
    storage: {
      from: vi.fn(),
      createBucket: vi.fn(),
      getBucket: vi.fn(),
      listBuckets: vi.fn(),
      updateBucket: vi.fn(),
      deleteBucket: vi.fn(),
      emptyBucket: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
    // Additional SupabaseClient properties
    supabaseUrl: "https://mock.supabase.co",
    supabaseKey: "mock-key",
    realtimeUrl: "https://mock.supabase.co/realtime",
    authUrl: "https://mock.supabase.co/auth",
    restUrl: "https://mock.supabase.co/rest",
    storageUrl: "https://mock.supabase.co/storage",
    functionsUrl: "https://mock.supabase.co/functions",
  };

  return mockClient as MockSupabaseClient;
};

export const resetMockSupabaseClient = (client: MockSupabaseClient) => {
  const resetMock = (mock: unknown) => {
    if (typeof mock === "function" && "mockReset" in mock && typeof mock.mockReset === "function") {
      mock.mockReset();
    }
  };

  // Reset all mock functions
  Object.values(client).forEach((mock) => {
    if (typeof mock === "object" && mock !== null) {
      if ("mockReset" in mock && typeof mock.mockReset === "function") {
        resetMock(mock);
      } else {
        Object.values(mock).forEach(resetMock);
      }
    } else {
      resetMock(mock);
    }
  });

  // Re-setup chaining for query builder methods
  const queryBuilder = client; // The client itself serves as the query builder
  Object.keys(client).forEach((key) => {
    const method = client[key as keyof MockSupabaseClient];
    if (typeof method === "function" && key !== "single" && key !== "maybeSingle" && key !== "rpc" && key !== "from") {
      (method as Mock).mockReturnValue(queryBuilder);
    }
  });
  // Ensure from returns the query builder
  (client as MockSupabaseClient).from.mockReturnValue(queryBuilder);
};

// =============================================================================
// BASIC MOCK SETUP HELPERS
// =============================================================================
export const mockCurrencyValidation = (client: SupabaseClient, currencyCode: string, exists = true) => {
  const mockResponse: MockResponse = {
    data: exists ? { code: currencyCode } : null,
    error: exists ? null : { message: "Currency not found" },
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockRpcCall = (client: SupabaseClient, rpcName: string, result: MockResponse) => {
  client.rpc.mockResolvedValueOnce(result);
};

export const mockMembershipVerification = (client: SupabaseClient, exists = true) => {
  const mockResponse: MockResponse = {
    data: exists ? { group_id: "group-123" } : null,
    error: exists ? null : { message: "No membership found" },
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockGroupBaseCurrency = (client: SupabaseClient, currencyCode = "USD") => {
  const mockResponse: MockResponse = {
    data: { base_currency_code: currencyCode },
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockGroupCurrencies = (client: SupabaseClient, currencies: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: currencies,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).order.mockResolvedValueOnce(mockResponse);
};

// =============================================================================
// COMPLEX QUERY MOCK HELPERS
// =============================================================================
export const mockGroupsQuery = (client: SupabaseClient, groups: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: groups,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).order.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).range.mockResolvedValueOnce(mockResponse);
};

export const mockGroupsCountQuery = (client: SupabaseClient, count = 0) => {
  const mockResponse: MockQueryResult = {
    count,
    data: null,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).count.mockResolvedValueOnce(mockResponse);
};

export const mockListGroupMembersQuery = (client: SupabaseClient, members: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: members,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).in.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockResolvedValueOnce(mockResponse);
};

export const mockUserExpensesQuery = (client: SupabaseClient, expenses: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: expenses,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).in.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockResolvedValueOnce(mockResponse);
};

export const mockUserSplitsQuery = (client: SupabaseClient, splits: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: splits,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).in.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockResolvedValueOnce(mockResponse);
};

export const mockSettlementsQuery = (client: SupabaseClient, settlements: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: settlements,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).in.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).or.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockResolvedValueOnce(mockResponse);
};

export const mockGroupCurrenciesQuery = (client: SupabaseClient, currencies: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: currencies,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).in.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockResolvedValueOnce(mockResponse);
};

// =============================================================================
// COMPLEX SCENARIO TEST DATA BUILDERS
// =============================================================================
export const createMockGroupWithMembers = (
  overrides: Partial<{
    id: string;
    name: string;
    base_currency_code: string;
    status: "active" | "inactive";
    created_at: string;
    group_members: { role: "admin" | "member" }[];
  }> = {}
) => ({
  id: "group-123",
  name: "Test Group",
  base_currency_code: "USD",
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  group_members: [{ role: "member" }],
  ...overrides,
});

export const createMockGroupMemberData = (
  overrides: Partial<{
    group_id: string;
    profile_id: string;
    status: "active" | "inactive";
    role: "admin" | "member";
    joined_at: string;
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
  }> = {}
) => ({
  group_id: "group-123",
  profile_id: "user-123",
  status: "active" as const,
  role: "member" as const,
  joined_at: "2024-01-01T00:00:00Z",
  profiles: {
    id: "user-123",
    full_name: "Test User",
    avatar_url: null,
  },
  ...overrides,
});

export const createMockExpenseData = (
  overrides: Partial<{
    group_id: string;
    amount: number;
    currency_code: string;
  }> = {}
) => ({
  group_id: "group-123",
  amount: 100,
  currency_code: "USD",
  ...overrides,
});

export const createMockSplitData = (
  overrides: Partial<{
    amount: number;
    expenses: {
      group_id: string;
      currency_code: string;
    };
  }> = {}
) => ({
  amount: 50,
  expenses: {
    group_id: "group-123",
    currency_code: "USD",
  },
  ...overrides,
});

export const createMockSettlementData = (
  overrides: Partial<{
    id: string;
    payer_id: string;
    payee_id: string;
    amount: number;
    currency_code: string;
    group_id: string;
  }> = {}
) => ({
  id: "settlement-123",
  payer_id: "user-123",
  payee_id: "123e4567-e89b-12d3-a456-426614174000",
  amount: 25,
  currency_code: "USD",
  group_id: "group-123",
  ...overrides,
});

// =============================================================================
// GROUP-SPECIFIC MOCK HELPERS
// =============================================================================
export const mockGroupMembership = (client: SupabaseClient, groupId: string, exists = true) => {
  const mockResponse: MockResponse = {
    data: exists ? { group_id: groupId } : null,
    error: exists ? null : { message: "No membership found" },
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockGroupDetailsQuery = (client: SupabaseClient, groupData: unknown) => {
  const mockResponse: MockResponse = {
    data: groupData,
    error: groupData === null ? { message: "No group found" } : null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockGroupMembersQuery = (client: SupabaseClient, members: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: members,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).order.mockResolvedValueOnce(mockResponse);
};

export const mockGroupInvitationsQuery = (client: SupabaseClient, invitations: unknown[] = []) => {
  const mockResponse: MockResponse = {
    data: invitations,
    error: null,
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).order.mockResolvedValueOnce(mockResponse);
};

// =============================================================================
// SPECIFICATION MOCK HELPERS
// =============================================================================
export const mockUserActiveMembership = (
  client: MockSupabaseClient,
  groupId: string,
  userId: string,
  active = true
) => {
  const mockResponse: MockResponse = {
    data: active ? { status: "active" } : null,
    error: active ? null : { message: "No membership found" },
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockCurrencyExists = (client: SupabaseClient, currencyCode: string, exists = true) => {
  const mockResponse: MockResponse = {
    data: exists ? { code: currencyCode } : null,
    error: exists ? null : { message: "Currency not found" },
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockCurrencyConfiguredForGroup = (
  client: MockSupabaseClient,
  groupId: string,
  currencyCode: string,
  configured = true
) => {
  const mockResponse: MockResponse = {
    data: configured ? { currency_code: currencyCode } : null,
    error: configured ? null : { message: "Currency not configured" },
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

export const mockGroupExistsAndActive = (client: SupabaseClient, groupId: string, exists = true) => {
  const mockResponse: MockResponse = {
    data: exists ? { id: groupId, status: "active" } : null,
    error: exists ? null : { message: "Group not found" },
  };

  (client as MockSupabaseClient).from.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).select.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).eq.mockReturnValueOnce(client as MockSupabaseClient);
  (client as MockSupabaseClient).single.mockResolvedValueOnce(mockResponse);
};

// =============================================================================
// REPOSITORY MOCK HELPERS
// =============================================================================
export const mockGroupRepositoryQuery = (client: SupabaseClient, table: string, result: MockQueryResult) => {
  const queryBuilder: Partial<MockSupabaseQueryBuilder> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockImplementation((...args: unknown[]) => {
      // Handle different order signatures: order(column) or order(column, options)
      if (args.length === 1) {
        // For simple order(column), return the queryBuilder which will be awaited
        return Promise.resolve(result);
      } else {
        // For order(column, options), return a chainable object that can also be awaited
        const chainableObject = {
          range: vi.fn().mockResolvedValue(result),
          then: vi.fn().mockImplementation((resolve) => resolve(result)),
        };
        return chainableObject;
      }
    }),
    range: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    count: vi.fn().mockReturnThis(),
  };

  client.from.mockReturnValueOnce(queryBuilder as MockSupabaseQueryBuilder);
  return queryBuilder;
};

export const mockExpenseRepositoryQuery = (client: SupabaseClient, table: string, result: MockQueryResult) => {
  const queryBuilder: Partial<MockSupabaseQueryBuilder> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockImplementation((...args: unknown[]) => {
      // Handle different order signatures: order(column) or order(column, options)
      if (args.length === 1) {
        return queryBuilder; // For simple order(column), continue chaining
      } else {
        // For order(column, options), return a chainable object
        return {
          range: vi.fn().mockResolvedValue(result),
        };
      }
    }),
    range: vi.fn().mockResolvedValue(result),
  };

  client.from.mockReturnValueOnce(queryBuilder as MockSupabaseQueryBuilder);
  return queryBuilder;
};

export const mockRpcQuery = (client: SupabaseClient, rpcName: string, result: MockResponse) => {
  client.rpc.mockResolvedValueOnce(result);
};

// =============================================================================
// COMMON TEST SETUP UTILITIES
// =============================================================================
export const setupRepositoryTest = <T>(RepositoryClass: new (client: SupabaseClient) => T) => {
  const mockSupabaseClient = createMockSupabaseClient();
  const repository = new RepositoryClass(mockSupabaseClient as unknown as SupabaseClient);
  vi.clearAllMocks();
  return { mockSupabaseClient, repository };
};

// =============================================================================
// EXPENSE SERVICE TEST HELPERS
// =============================================================================
export const createMockExpenseCommand = (
  overrides: Partial<{
    description: string;
    amount: number;
    currency_code: string;
    expense_date: string;
    payer_id: string;
    splits: { profile_id: string; amount: number }[];
  }> = {}
): {
  description: string;
  amount: number;
  currency_code: string;
  expense_date: string;
  payer_id: string;
  splits: { profile_id: string; amount: number }[];
} => ({
  description: "Lunch at restaurant",
  amount: 50.0,
  currency_code: "USD",
  expense_date: "2024-01-15T10:00",
  payer_id: "123e4567-e89b-12d3-a456-426614174000",
  splits: [
    { profile_id: "123e4567-e89b-12d3-a456-426614174000", amount: 25.0 },
    { profile_id: "987fcdeb-51a2-43d7-8f9e-123456789abc", amount: 25.0 },
  ],
  ...overrides,
});

export const createMockExpenseInsert = (
  overrides: Partial<{
    id: string;
    group_id: string;
    description: string;
    amount: number;
    currency_code: string;
    expense_date: string;
    created_by: string;
    payer_id: string;
  }> = {}
) => ({
  id: "expense-123",
  group_id: "group-123",
  description: "Lunch at restaurant",
  amount: 50.0,
  currency_code: "USD",
  expense_date: "2024-01-15T10:00",
  created_by: "123e4567-e89b-12d3-a456-426614174000",
  payer_id: "123e4567-e89b-12d3-a456-426614174000",
  ...overrides,
});

export const createMockCompleteExpense = (
  overrides: Partial<{
    id: string;
    group_id: string;
    description: string;
    amount: number;
    currency_code: string;
    expense_date: string;
    created_by: string;
    payer_id: string;
    created_at: string;
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    expense_splits: {
      profile_id: string;
      amount: number;
      profiles: {
        id: string;
        full_name: string;
        avatar_url: string | null;
      };
    }[];
  }> = {}
) => ({
  ...createMockExpenseInsert(),
  created_at: "2024-01-15T10:00:00Z",
  profiles: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    full_name: "John Doe",
    avatar_url: null,
  },
  expense_splits: [
    {
      profile_id: "123e4567-e89b-12d3-a456-426614174000",
      amount: 25.0,
      profiles: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        full_name: "John Doe",
        avatar_url: null,
      },
    },
    {
      profile_id: "987fcdeb-51a2-43d7-8f9e-123456789abc",
      amount: 25.0,
      profiles: {
        id: "987fcdeb-51a2-43d7-8f9e-123456789abc",
        full_name: "Jane Smith",
        avatar_url: null,
      },
    },
  ],
  ...overrides,
});

export const createMockExpenseGroup = (
  overrides: Partial<{
    id: string;
    base_currency_code: string;
    group_currencies: { currency_code: string; exchange_rate: number }[];
    group_members: { profile_id: string; status: "active" | "inactive" }[];
  }> = {}
) => ({
  id: "group-123",
  base_currency_code: "USD",
  group_currencies: [
    { currency_code: "USD", exchange_rate: 1.0 },
    { currency_code: "EUR", exchange_rate: 1.2 },
  ],
  group_members: [
    { profile_id: "123e4567-e89b-12d3-a456-426614174000", status: "active" },
    { profile_id: "987fcdeb-51a2-43d7-8f9e-123456789abc", status: "active" },
  ],
  ...overrides,
});

export const createMockExpenseActiveMembers = (overrides: { profile_id: string }[] = []) => [
  { profile_id: "123e4567-e89b-12d3-a456-426614174000" },
  { profile_id: "987fcdeb-51a2-43d7-8f9e-123456789abc" },
  ...overrides,
];

// Expense service mock setup helper - improved version
export const setupExpenseMocks = (
  mockClient: SupabaseClient,
  config: {
    groups?: MockResponse;
    groupMembers?: MockResponse;
    expenseInsert?: MockResponse;
    expenseSelect?: MockResponse;
    expenseSplitsInsert?: MockResponse;
  }
) => {
  // Local counters for this mock setup instance
  let expenseSingleCallCount = 0;

  (mockClient as MockSupabaseClient).from.mockImplementation((table: string) => {
    switch (table) {
      case "groups":
        if (config.groups) {
          const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            eq: vi.fn().mockImplementation((_field: string, _value: unknown) => {
              // Groups query has chained eq() calls, return query builder that eventually resolves
              return {
                ...queryBuilder,
                single: vi.fn().mockResolvedValue(config.groups),
              };
            }),
            single: vi.fn().mockResolvedValue(config.groups),
          };
          return queryBuilder as MockSupabaseQueryBuilder;
        }
        break;

      case "group_members":
        if (config.groupMembers) {
          const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),

            eq: vi.fn().mockImplementation((_field: string, _value: unknown) => {
              // For fetchActiveGroupMembers, return data when querying by status = active
              if (_field === "status" && _value === "active") {
                return Promise.resolve(config.groupMembers);
              }
              return queryBuilder;
            }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
          return queryBuilder as MockSupabaseQueryBuilder;
        }
        break;

      case "expenses":
        if (config.expenseInsert || config.expenseSelect) {
          const queryBuilder = {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(async () => {
              expenseSingleCallCount++;
              if (expenseSingleCallCount === 1 && config.expenseInsert) {
                return config.expenseInsert;
              }
              if (expenseSingleCallCount === 2 && config.expenseSelect) {
                return config.expenseSelect;
              }
              return { data: null, error: null };
            }),
          };
          return queryBuilder as MockSupabaseQueryBuilder;
        }
        break;

      case "expense_splits":
        if (config.expenseSplitsInsert !== undefined) {
          return {
            insert: vi.fn().mockResolvedValue(config.expenseSplitsInsert),
            select: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as MockSupabaseQueryBuilder;
        }
        break;
    }

    // Default mock for unhandled tables
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as MockSupabaseQueryBuilder;
  });

  return mockClient;
};

// Assertion helpers for expense service
export const expectExpenseValidationError = async (promise: Promise<unknown>, expectedMessage: string) => {
  await expect(promise).rejects.toThrow(ExpenseValidationError);
  try {
    await promise;
  } catch (error) {
    expect((error as ExpenseValidationError).message).toBe(expectedMessage);
  }
};

export const expectExpenseDTO = (result: unknown, expected: Record<string, unknown>) => {
  expect(result).toMatchObject(expected);
};

// Expense service test fixtures - common setups
export const createValidExpenseScenario = () => ({
  groupData: createMockExpenseGroup(),
  activeMembers: createMockExpenseActiveMembers(),
  expenseInsert: { data: createMockExpenseInsert(), error: null },
  expenseSelect: { data: createMockCompleteExpense(), error: null },
  expenseSplitsInsert: { data: null, error: null },
});

export const createGroupNotFoundScenario = () => ({
  groupData: null,
  activeMembers: null,
  expenseInsert: null,
  expenseSelect: null,
  expenseSplitsInsert: null,
});

export const createPayerNotMemberScenario = (groupData = createMockExpenseGroup()) => ({
  groupData,
  activeMembers: createMockExpenseActiveMembers([{ profile_id: "123e4567-e89b-12d3-a456-426614174000" }]), // Only 123e4567-e89b-12d3-a456-426614174000
  expenseInsert: null,
  expenseSelect: null,
  expenseSplitsInsert: null,
});

export const createCurrencyNotConfiguredScenario = (
  groupData = createMockExpenseGroup({
    group_currencies: [{ currency_code: "USD", exchange_rate: 1.0 }], // Only USD
  })
) => ({
  groupData,
  activeMembers: createMockExpenseActiveMembers(),
  expenseInsert: null,
  expenseSelect: null,
  expenseSplitsInsert: null,
});

export const createExpenseInsertFailureScenario = () => ({
  groupData: createMockExpenseGroup(),
  activeMembers: createMockExpenseActiveMembers(),
  expenseInsert: { data: null, error: { message: "Insert failed" } },
});

export const createExpenseSplitsInsertFailureScenario = () => ({
  groupData: createMockExpenseGroup(),
  activeMembers: createMockExpenseActiveMembers(),
  expenseInsert: { data: createMockExpenseInsert(), error: null },
  expenseSplitsInsert: { data: null, error: { message: "Splits insert failed" } },
});

export const createExpenseSelectFailureScenario = () => ({
  groupData: createMockExpenseGroup(),
  activeMembers: createMockExpenseActiveMembers(),
  expenseInsert: { data: createMockExpenseInsert(), error: null },
  expenseSelect: { data: null, error: { message: "Select failed" } },
  expenseSplitsInsert: { data: null, error: null },
});

// =============================================================================
// TEST CONSTANTS
// =============================================================================
export const TEST_GROUP_ID = "group-123";
export const TEST_USER_ID = "user-123";
export const TEST_CURRENCY_CODE = "USD";
export const TEST_INVALID_CURRENCY_CODE = "INVALID";

// Helper functions for common specification tests
export const createValidGroupCreationCommand = (
  overrides: Partial<{
    name: string;
    base_currency_code: string;
  }> = {}
) => ({
  name: "Test Group",
  base_currency_code: TEST_CURRENCY_CODE,
  ...overrides,
});

export const createInvalidGroupCreationCommand = (
  overrides: Partial<{
    name: string;
    base_currency_code: string;
  }> = {}
) => ({
  name: "",
  base_currency_code: "",
  ...overrides,
});

// =============================================================================
// AUTH TEST HELPERS
// =============================================================================
export const createMockAuthSupabaseClient = (authOverrides: Partial<AuthMockSetupConfig> = {}): MockSupabaseClient => {
  const mockClient = createMockSupabaseClient();

  // Override auth methods
  if (authOverrides.signUp) {
    mockClient.auth.signUp.mockResolvedValue(authOverrides.signUp);
  }
  if (authOverrides.signIn) {
    mockClient.auth.signIn.mockResolvedValue(authOverrides.signIn);
  }
  if (authOverrides.signOut) {
    mockClient.auth.signOut.mockResolvedValue(authOverrides.signOut);
  }
  if (authOverrides.resetPassword) {
    mockClient.auth.resetPassword.mockResolvedValue(authOverrides.resetPassword);
  }
  if (authOverrides.resetPasswordForEmail) {
    mockClient.auth.resetPasswordForEmail.mockResolvedValue(authOverrides.resetPasswordForEmail);
  }
  if (authOverrides.updateUser) {
    mockClient.auth.updateUser.mockResolvedValue(authOverrides.updateUser);
  }
  if (authOverrides.setSession) {
    mockClient.auth.setSession.mockResolvedValue(authOverrides.setSession);
  }
  if (authOverrides.refreshSession) {
    mockClient.auth.refreshSession.mockResolvedValue(authOverrides.refreshSession);
  }
  if (authOverrides.getSession) {
    mockClient.auth.getSession.mockResolvedValue(authOverrides.getSession);
  }
  if (authOverrides.getUser) {
    mockClient.auth.getUser.mockResolvedValue(authOverrides.getUser);
  }
  if (authOverrides.verifyOtp) {
    mockClient.auth.verifyOtp.mockResolvedValue(authOverrides.verifyOtp);
  }
  if (authOverrides.resend) {
    mockClient.auth.resend.mockResolvedValue(authOverrides.resend);
  }

  return mockClient;
};

export const createMockUseSupabaseAuth = (
  overrides: Partial<{
    supabase: MockSupabaseClient;
    signIn: Mock<(...args: unknown[]) => Promise<unknown>>;
    signUp: Mock<(...args: unknown[]) => Promise<unknown>>;
    signOut: Mock<() => Promise<unknown>>;
    signInWithOAuth: Mock<(...args: unknown[]) => Promise<unknown>>;
    resetPassword: Mock<(...args: unknown[]) => Promise<unknown>>;
    updateUser: Mock<(...args: unknown[]) => Promise<unknown>>;
  }> = {}
) => ({
  supabase: createMockAuthSupabaseClient(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPassword: vi.fn(),
  updateUser: vi.fn(),
  ...overrides,
});

export const setupLogoutTestMocks = (
  signOutResult: { error: AuthError | null } | Promise<{ error: AuthError | null }> | string
) => {
  const mockClient = createMockAuthSupabaseClient();
  const mockUseSupabaseAuth = createMockUseSupabaseAuth({ supabase: mockClient });

  if (signOutResult === "throw_error") {
    mockClient.auth.signOut.mockRejectedValue(new Error("Network error"));
  } else if (signOutResult instanceof Promise) {
    mockClient.auth.signOut.mockImplementation(() => signOutResult);
  } else if (typeof signOutResult === "object" && "error" in signOutResult) {
    mockClient.auth.signOut.mockResolvedValue(signOutResult);
  } else {
    throw new Error(`Invalid signOutResult type: ${typeof signOutResult}`);
  }

  return { mockClient, mockUseSupabaseAuth };
};

// =============================================================================
// LOGOUT TEST FIXTURES
// =============================================================================
export const createLogoutTestFixture = () => ({
  mockAssign: vi.fn(),
  setupWindowLocation: () => {
    Object.defineProperty(window, "location", {
      value: { assign: vi.fn() },
      writable: true,
    });
  },
  renderHookAndLogout: async (
    mockResult: { error: AuthError | null } | Promise<{ error: AuthError | null }> | string
  ) => {
    const { mockUseSupabaseAuth } = setupLogoutTestMocks(mockResult);

    // Import renderHook and act here to avoid circular dependencies
    const { renderHook, act } = await import("@testing-library/react");

    // Import useLogout here to avoid circular dependencies
    const { useLogout } = await import("../../lib/hooks/useLogout");

    // Mock useSupabaseAuth - this assumes useSupabaseAuth is already mocked at module level
    const { useSupabaseAuth } = await import("../../lib/hooks/useSupabaseAuth");
    vi.mocked(useSupabaseAuth).mockReturnValue(mockUseSupabaseAuth);

    const { result } = renderHook(() => useLogout());

    let logoutResult;
    await act(async () => {
      logoutResult = await result.current.logout();
    });

    return { result, logoutResult, mockUseSupabaseAuth };
  },
});
