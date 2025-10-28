import type { SupabaseClient } from "@supabase/supabase-js";
import { ExpenseValidationError } from "../../lib/services/expenseService";

// Factory functions for test data
export const createMockCreateGroupCommand = (overrides: Partial<any> = {}) => ({
  name: "Test Group",
  base_currency_code: "USD",
  invite_emails: ["user1@test.com", "user2@test.com"],
  ...overrides,
});

export const createMockGroupDetail = (overrides: Partial<any> = {}) => ({
  id: "group-123",
  name: "Test Group",
  base_currency_code: "USD",
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockGroupMember = (overrides: Partial<any> = {}) => ({
  profile_id: "user-123",
  full_name: "Test User",
  email: "test@example.com",
  avatar_url: null,
  role: "member" as const,
  status: "active" as const,
  joined_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockGroupCurrency = (overrides: Partial<any> = {}) => ({
  code: "USD",
  name: "US Dollar",
  exchange_rate: 1.0,
  ...overrides,
});

export const createMockGroupDetailDTO = (overrides: Partial<any> = {}) => ({
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

export const createMockPendingInvitation = (overrides: Partial<any> = {}) => ({
  id: "inv-1",
  email: "pending@example.com",
  status: "pending" as const,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockGroupListItem = (overrides: Partial<any> = {}) => ({
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

// Supabase mock helpers
export const createMockSupabaseClient = (): SupabaseClient => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    rpc: vi.fn(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    head: vi.fn().mockReturnThis(),
  };

  // Setup default chainable mocks
  mockClient.from.mockReturnValue(mockClient);
  mockClient.select.mockReturnValue(mockClient);
  mockClient.eq.mockReturnValue(mockClient);
  mockClient.order.mockReturnValue(mockClient);
  mockClient.range.mockReturnValue(mockClient);
  mockClient.in.mockReturnValue(mockClient);
  mockClient.or.mockReturnValue(mockClient);
  mockClient.count.mockReturnValue(mockClient);
  mockClient.head.mockReturnValue(mockClient);

  return mockClient as unknown as SupabaseClient;
};

export const resetMockSupabaseClient = (client: SupabaseClient) => {
  const mockClient = client as any;
  Object.values(mockClient).forEach((mock) => {
    if (typeof mock === "function" && "mockReset" in mock && typeof mock.mockReset === "function") {
      mock.mockReset();
    }
  });

  // Re-setup default chainable mocks
  mockClient.from.mockReturnValue(mockClient);
  mockClient.select.mockReturnValue(mockClient);
  mockClient.eq.mockReturnValue(mockClient);
  mockClient.order.mockReturnValue(mockClient);
  mockClient.range.mockReturnValue(mockClient);
  mockClient.in.mockReturnValue(mockClient);
  mockClient.or.mockReturnValue(mockClient);
  mockClient.count.mockReturnValue(mockClient);
  mockClient.head.mockReturnValue(mockClient);
};

// Specific mock setup helpers
export const mockCurrencyValidation = (client: SupabaseClient, currencyCode: string, exists = true) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.single.mockResolvedValueOnce({
    data: exists ? { code: currencyCode } : null,
    error: exists ? null : { message: "Currency not found" },
  });
};

export const mockRpcCall = (client: SupabaseClient, rpcName: string, result: any) => {
  const mockClient = client as any;
  mockClient.rpc.mockResolvedValueOnce(result);
};

export const mockMembershipVerification = (client: SupabaseClient, exists = true) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.single.mockResolvedValueOnce({
    data: exists ? { group_id: "group-123" } : null,
    error: exists ? null : { message: "No membership found" },
  });
};

export const mockGroupBaseCurrency = (client: SupabaseClient, currencyCode = "USD") => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.single.mockResolvedValueOnce({
    data: { base_currency_code: currencyCode },
    error: null,
  });
};

export const mockGroupCurrencies = (client: SupabaseClient, currencies: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.order.mockResolvedValueOnce({
    data: currencies,
    error: null,
  });
};

// Complex query mock helpers for listGroups
export const mockGroupsQuery = (client: SupabaseClient, groups: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.order.mockReturnValueOnce(mockClient);
  mockClient.range.mockResolvedValueOnce({
    data: groups,
    error: null,
  });
};

export const mockGroupsCountQuery = (client: SupabaseClient, count = 0) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.count.mockResolvedValueOnce({
    count,
    error: null,
  });
};

export const mockListGroupMembersQuery = (client: SupabaseClient, members: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.in.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockResolvedValueOnce({
    data: members,
    error: null,
  });
};

export const mockUserExpensesQuery = (client: SupabaseClient, expenses: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.in.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockResolvedValueOnce({
    data: expenses,
    error: null,
  });
};

export const mockUserSplitsQuery = (client: SupabaseClient, splits: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.in.mockReturnValueOnce(mockClient);
  mockClient.eq.mockResolvedValueOnce({
    data: splits,
    error: null,
  });
};

export const mockSettlementsQuery = (client: SupabaseClient, settlements: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.in.mockReturnValueOnce(mockClient);
  mockClient.or.mockReturnValueOnce(mockClient);
  mockClient.eq.mockResolvedValueOnce({
    data: settlements,
    error: null,
  });
};

export const mockGroupCurrenciesQuery = (client: SupabaseClient, currencies: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.in.mockReturnValueOnce(mockClient);
  mockClient.eq.mockResolvedValueOnce({
    data: currencies,
    error: null,
  });
};

// Test data builders for complex scenarios
export const createMockGroupWithMembers = (overrides: Partial<any> = {}) => ({
  id: "group-123",
  name: "Test Group",
  base_currency_code: "USD",
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  group_members: [{ role: "member" }],
  ...overrides,
});

export const createMockGroupMemberData = (overrides: Partial<any> = {}) => ({
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

export const createMockExpenseData = (overrides: Partial<any> = {}) => ({
  group_id: "group-123",
  amount: 100,
  currency_code: "USD",
  ...overrides,
});

export const createMockSplitData = (overrides: Partial<any> = {}) => ({
  amount: 50,
  expenses: {
    group_id: "group-123",
    currency_code: "USD",
  },
  ...overrides,
});

export const createMockSettlementData = (overrides: Partial<any> = {}) => ({
  id: "settlement-123",
  payer_id: "user-123",
  payee_id: "123e4567-e89b-12d3-a456-426614174000",
  amount: 25,
  currency_code: "USD",
  group_id: "group-123",
  ...overrides,
});

// Group currencies specific helpers
export const mockGroupMembership = (client: SupabaseClient, groupId: string, exists = true) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.single.mockResolvedValueOnce({
    data: exists ? { group_id: groupId } : null,
    error: exists ? null : { message: "No membership found" },
  });
};

export const mockGroupDetailsQuery = (client: SupabaseClient, groupData: any) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.single.mockResolvedValueOnce({
    data: groupData,
    error: groupData === null ? { message: "No group found" } : null,
  });
};

export const mockGroupMembersQuery = (client: SupabaseClient, members: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.order.mockResolvedValueOnce({
    data: members,
    error: null,
  });
};

export const mockGroupInvitationsQuery = (client: SupabaseClient, invitations: any[] = []) => {
  const mockClient = client as any;
  mockClient.from.mockReturnValueOnce(mockClient);
  mockClient.select.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.eq.mockReturnValueOnce(mockClient);
  mockClient.order.mockResolvedValueOnce({
    data: invitations,
    error: null,
  });
};

// Expense Service specific fixtures and mock builders
export const createMockExpenseCommand = (overrides: Partial<any> = {}): any => ({
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

export const createMockExpenseInsert = (overrides: Partial<any> = {}) => ({
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

export const createMockCompleteExpense = (overrides: Partial<any> = {}) => ({
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

export const createMockExpenseGroup = (overrides: Partial<any> = {}) => ({
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

export const createMockExpenseActiveMembers = (overrides: any[] = []) => [
  { profile_id: "123e4567-e89b-12d3-a456-426614174000" },
  { profile_id: "987fcdeb-51a2-43d7-8f9e-123456789abc" },
  ...overrides,
];

// Expense service mock setup helper - improved version
export const setupExpenseMocks = (
  mockClient: any,
  config: {
    groups?: { data: any; error: any };
    groupMembers?: { data: any; error: any };
    expenseInsert?: { data: any; error: any };
    expenseSelect?: { data: any; error: any };
    expenseSplitsInsert?: { error: any };
  }
) => {
  // Local counters for this mock setup instance
  let expenseSingleCallCount = 0;
  let groupMembersCallCount = 0;

  mockClient.from.mockImplementation((table: string) => {
    switch (table) {
      case "groups":
        if (config.groups) {
          const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((field: string, value: any) => {
              // Groups query has chained eq() calls, return query builder that eventually resolves
              return {
                ...queryBuilder,
                single: vi.fn().mockResolvedValue(config.groups),
              };
            }),
            single: vi.fn().mockResolvedValue(config.groups),
          };
          return queryBuilder;
        }
        break;

      case "group_members":
        if (config.groupMembers) {
          const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => {
              groupMembersCallCount++;
              // Group members query returns result on the final eq() call (usually 2nd call)
              if (groupMembersCallCount === 2) {
                return Promise.resolve(config.groupMembers);
              }
              return queryBuilder;
            }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
          return queryBuilder;
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
          return queryBuilder;
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
          };
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
    };
  });

  return mockClient;
};

// Assertion helpers for expense service
export const expectExpenseValidationError = async (promise: Promise<any>, expectedMessage: string) => {
  await expect(promise).rejects.toThrow(ExpenseValidationError);
  try {
    await promise;
  } catch (error) {
    expect((error as ExpenseValidationError).message).toBe(expectedMessage);
  }
};

export const expectExpenseDTO = (result: any, expected: Partial<any>) => {
  expect(result).toMatchObject(expected);
};

// Expense service test fixtures - common setups
export const createValidExpenseScenario = () => ({
  groupData: createMockExpenseGroup(),
  activeMembers: createMockExpenseActiveMembers(),
  expenseInsert: { data: createMockExpenseInsert(), error: null },
  expenseSelect: { data: createMockCompleteExpense(), error: null },
  expenseSplitsInsert: { error: null },
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
  expenseSplitsInsert: { error: { message: "Splits insert failed" } },
});

export const createExpenseSelectFailureScenario = () => ({
  groupData: createMockExpenseGroup(),
  activeMembers: createMockExpenseActiveMembers(),
  expenseInsert: { data: createMockExpenseInsert(), error: null },
  expenseSelect: { data: null, error: { message: "Select failed" } },
  expenseSplitsInsert: { error: null },
});

// Auth-specific mock helpers
export const createMockAuthSupabaseClient = (authOverrides: Partial<any> = {}): SupabaseClient => {
  const mockClient = createMockSupabaseClient();
  const mockClientAny = mockClient as any;

  // Override auth methods
  mockClientAny.auth = {
    signOut: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    resetPassword: vi.fn(),
    updateUser: vi.fn(),
    ...authOverrides,
  };

  return mockClient;
};

export const createMockUseSupabaseAuth = (overrides: Partial<any> = {}) => ({
  supabase: createMockAuthSupabaseClient(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPassword: vi.fn(),
  updateUser: vi.fn(),
  ...overrides,
});

export const setupLogoutTestMocks = (signOutResult: { error: any } | Promise<{ error: any }> | string) => {
  const mockClient = createMockAuthSupabaseClient();
  const mockUseSupabaseAuth = createMockUseSupabaseAuth({ supabase: mockClient });

  if (signOutResult === "throw_error") {
    vi.mocked(mockClient.auth.signOut).mockRejectedValue(new Error("Network error"));
  } else if (signOutResult instanceof Promise) {
    vi.mocked(mockClient.auth.signOut).mockImplementation(() => signOutResult);
  } else if (typeof signOutResult === "object" && "error" in signOutResult) {
    vi.mocked(mockClient.auth.signOut).mockResolvedValue(signOutResult);
  } else {
    throw new Error(`Invalid signOutResult type: ${typeof signOutResult}`);
  }

  return { mockClient, mockUseSupabaseAuth };
};

// Logout test fixtures
export const createLogoutTestFixture = () => ({
  mockAssign: vi.fn(),
  setupWindowLocation: () => {
    Object.defineProperty(window, "location", {
      value: { assign: vi.fn() },
      writable: true,
    });
  },
  renderHookAndLogout: async (mockResult: { error: any } | Promise<{ error: any }> | string) => {
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
