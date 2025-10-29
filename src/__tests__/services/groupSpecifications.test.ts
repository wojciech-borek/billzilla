import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import {
  UserIsActiveGroupMemberSpecification,
  CurrencyExistsSpecification,
  CurrencyConfiguredForGroupSpecification,
  GroupNameValidSpecification,
  GroupBaseCurrencyValidSpecification,
  GroupExistsAndActiveSpecification,
  AndSpecification,
  OrSpecification,
  NotSpecification,
  GroupCreationValidSpecification,
} from "@/lib/services/specifications/groupSpecifications";
import { CurrencyNotFoundError } from "@/lib/services/errors/groupErrors";
import {
  createMockSupabaseClient,
  mockUserActiveMembership,
  mockCurrencyExists,
  mockCurrencyConfiguredForGroup,
  mockGroupExistsAndActive,
  TEST_GROUP_ID,
  TEST_USER_ID,
  TEST_CURRENCY_CODE,
  TEST_INVALID_CURRENCY_CODE,
  createValidGroupCreationCommand,
} from "./testHelpers";

// Test fixtures for specification testing
const createBasicSpecTestFixture = <T extends { new (client: SupabaseClient<Database>): any }>(
  SpecClass: T,
  mockSetup: (client: SupabaseClient<Database>) => void
) => ({
  setup: (mockSupabase: SupabaseClient<Database>) => {
    mockSetup(mockSupabase);
    return new SpecClass(mockSupabase);
  }
});

const createSyncSpecTestFixture = <T extends { new (): any }>(SpecClass: T) => ({
  setup: () => new SpecClass()
});

// Specification-specific mock fixtures
const membershipSpecFixtures = {
  activeMember: (client: SupabaseClient<Database>) =>
    mockUserActiveMembership(client, TEST_GROUP_ID, TEST_USER_ID, true),
  inactiveMember: (client: SupabaseClient<Database>) =>
    mockUserActiveMembership(client, TEST_GROUP_ID, TEST_USER_ID, false)
};

const currencySpecFixtures = {
  exists: (client: SupabaseClient<Database>) =>
    mockCurrencyExists(client, TEST_CURRENCY_CODE, true),
  notExists: (client: SupabaseClient<Database>) =>
    mockCurrencyExists(client, TEST_INVALID_CURRENCY_CODE, false)
};

const groupCurrencySpecFixtures = {
  configured: (client: SupabaseClient<Database>) =>
    mockCurrencyConfiguredForGroup(client, TEST_GROUP_ID, TEST_CURRENCY_CODE, true),
  notConfigured: (client: SupabaseClient<Database>) =>
    mockCurrencyConfiguredForGroup(client, TEST_GROUP_ID, "EUR", false)
};

const groupSpecFixtures = {
  existsAndActive: (client: SupabaseClient<Database>) =>
    mockGroupExistsAndActive(client, TEST_GROUP_ID, true),
  notExistsOrInactive: (client: SupabaseClient<Database>) =>
    mockGroupExistsAndActive(client, TEST_GROUP_ID, false)
};

// Parameterized test data tables
const groupNameValidationTestCases: Array<{ input: string | null | undefined; expected: boolean; description: string }> = [
  { input: "Valid Name", expected: true, description: "valid name" },
  { input: null, expected: false, description: "null value" },
  { input: undefined, expected: false, description: "undefined value" },
  { input: "", expected: false, description: "empty string" },
  { input: "   ", expected: false, description: "whitespace only" },
  { input: "a".repeat(100), expected: true, description: "very long name" }
];

const currencyCodeValidationTestCases: Array<{ input: string | null | undefined; expected: boolean; description: string }> = [
  { input: TEST_CURRENCY_CODE, expected: true, description: "valid currency code" },
  { input: null, expected: false, description: "null currency code" },
  { input: undefined, expected: false, description: "undefined currency code" },
  { input: "", expected: false, description: "empty currency code" },
  { input: "   ", expected: false, description: "whitespace only currency code" },
  { input: "usd", expected: true, description: "lowercase currency code" },
  { input: "US", expected: true, description: "short currency code" },
  { input: "USDT", expected: true, description: "4-character currency code" },
  { input: "123", expected: true, description: "numeric currency code" },
  { input: "A", expected: true, description: "single character currency code" }
];

const compositeSpecTestMatrix = [
  { specA: true, specB: true, andResult: true, orResult: true },
  { specA: true, specB: false, andResult: false, orResult: true },
  { specA: false, specB: false, andResult: false, orResult: false }
];

const groupCreationInvalidTestCases: Array<[string, { name: string | null | undefined; base_currency_code: string | null | undefined }]> = [
  ["empty name", { name: "", base_currency_code: TEST_CURRENCY_CODE }],
  ["empty currency code", { name: "Test Group", base_currency_code: "" }],
  ["both empty", { name: "", base_currency_code: "" }],
  ["null name", { name: null, base_currency_code: TEST_CURRENCY_CODE }],
  ["null currency", { name: "Test Group", base_currency_code: null }],
  ["undefined name", { name: undefined, base_currency_code: TEST_CURRENCY_CODE }],
  ["undefined currency", { name: "Test Group", base_currency_code: undefined }],
  ["whitespace name", { name: "   ", base_currency_code: TEST_CURRENCY_CODE }],
  ["whitespace currency", { name: "Test Group", base_currency_code: "   " }]
];

describe("Group Specifications", () => {
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("UserIsActiveGroupMemberSpecification", () => {
    it("should return true when user is active member", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        UserIsActiveGroupMemberSpecification,
        membershipSpecFixtures.activeMember
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      const result = await spec.isSatisfiedBy({ groupId: TEST_GROUP_ID, userId: TEST_USER_ID });
      expect(result).toBe(true);
    });

    it("should return false when user is inactive member", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        UserIsActiveGroupMemberSpecification,
        membershipSpecFixtures.inactiveMember
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      const result = await spec.isSatisfiedBy({ groupId: TEST_GROUP_ID, userId: TEST_USER_ID });
      expect(result).toBe(false);
    });
  });

  describe("CurrencyExistsSpecification", () => {
    it("should return true when currency exists", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        CurrencyExistsSpecification,
        currencySpecFixtures.exists
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      const result = await spec.isSatisfiedBy(TEST_CURRENCY_CODE);
      expect(result).toBe(true);
    });

    it("should throw CurrencyNotFoundError when currency does not exist", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        CurrencyExistsSpecification,
        currencySpecFixtures.notExists
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      await expect(spec.isSatisfiedBy(TEST_INVALID_CURRENCY_CODE)).rejects.toThrow(CurrencyNotFoundError);
    });
  });

  describe("CurrencyConfiguredForGroupSpecification", () => {
    it("should return true when currency is configured for group", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        CurrencyConfiguredForGroupSpecification,
        groupCurrencySpecFixtures.configured
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      const result = await spec.isSatisfiedBy({ groupId: TEST_GROUP_ID, currencyCode: TEST_CURRENCY_CODE });
      expect(result).toBe(true);
    });

    it("should return false when currency is not configured for group", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        CurrencyConfiguredForGroupSpecification,
        groupCurrencySpecFixtures.notConfigured
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      const result = await spec.isSatisfiedBy({ groupId: TEST_GROUP_ID, currencyCode: "EUR" });
      expect(result).toBe(false);
    });
  });

  describe("GroupNameValidSpecification", () => {
    const specFixture = createSyncSpecTestFixture(GroupNameValidSpecification);
    const spec = specFixture.setup();

    it.each(groupNameValidationTestCases)(
      "should validate $description -> $expected",
      ({ input, expected }) => {
        expect(spec.isSatisfiedBy(input as any)).toBe(expected);
      }
    );
  });

  describe("GroupBaseCurrencyValidSpecification", () => {
    const specFixture = createSyncSpecTestFixture(GroupBaseCurrencyValidSpecification);
    const spec = specFixture.setup();

    it.each(currencyCodeValidationTestCases)(
      "should validate $description -> $expected",
      ({ input, expected }) => {
        expect(spec.isSatisfiedBy(input as any)).toBe(expected);
      }
    );
  });

  describe("GroupExistsAndActiveSpecification", () => {
    it("should return true when group exists and is active", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        GroupExistsAndActiveSpecification,
        groupSpecFixtures.existsAndActive
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      const result = await spec.isSatisfiedBy(TEST_GROUP_ID);
      expect(result).toBe(true);
    });

    it("should return false when group does not exist or is inactive", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        GroupExistsAndActiveSpecification,
        groupSpecFixtures.notExistsOrInactive
      );
      const spec = specFixture.setup(mockSupabase);

      // Act & Assert
      const result = await spec.isSatisfiedBy(TEST_GROUP_ID);
      expect(result).toBe(false);
    });
  });

  describe("Composite Specifications", () => {
    const nameSpecFixture = createSyncSpecTestFixture(GroupNameValidSpecification);
    const currencySpecFixture = createSyncSpecTestFixture(GroupBaseCurrencyValidSpecification);

    const validNameSpec = nameSpecFixture.setup();
    const validCurrencySpec = currencySpecFixture.setup();

    describe("AndSpecification", () => {
      it("should return true when both specifications are satisfied", async () => {
        const andSpec = new AndSpecification(validNameSpec, validCurrencySpec);
        const result = await andSpec.isSatisfiedBy("Test Group");
        expect(result).toBe(true);
      });

      it("should return false when first specification fails", async () => {
        const andSpec = new AndSpecification(validNameSpec, validCurrencySpec);
        const result = await andSpec.isSatisfiedBy("");
        expect(result).toBe(false);
      });

      it("should return false when second specification fails", async () => {
        const andSpec = new AndSpecification(validNameSpec, validCurrencySpec);
        const result = await andSpec.isSatisfiedBy(null);
        expect(result).toBe(false);
      });
    });

    describe("OrSpecification", () => {
      it("should return true when both specifications are satisfied", async () => {
        const orSpec = new OrSpecification(validNameSpec, validCurrencySpec);
        const result = await orSpec.isSatisfiedBy("Test Group");
        expect(result).toBe(true);
      });

      it("should return true when only first specification is satisfied", async () => {
        const orSpec = new OrSpecification(validNameSpec, validCurrencySpec);
        const result = await orSpec.isSatisfiedBy("Test Group");
        expect(result).toBe(true);
      });

      it("should return false when both specifications fail", async () => {
        const orSpec = new OrSpecification(validNameSpec, validCurrencySpec);
        const result = await orSpec.isSatisfiedBy(null);
        expect(result).toBe(false);
      });
    });

    describe("NotSpecification", () => {
      it("should return false when specification is satisfied", async () => {
        const notSpec = new NotSpecification(validNameSpec);
        const result = await notSpec.isSatisfiedBy("Test Group");
        expect(result).toBe(false);
      });

      it("should return true when specification is not satisfied", async () => {
        const notSpec = new NotSpecification(validNameSpec);
        const result = await notSpec.isSatisfiedBy("");
        expect(result).toBe(true);
      });
    });
  });

  describe("GroupCreationValidSpecification", () => {
    it("should return true when group creation command is valid", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        GroupCreationValidSpecification,
        currencySpecFixtures.exists
      );
      const spec = specFixture.setup(mockSupabase);
      const command = createValidGroupCreationCommand();

      // Act & Assert
      const result = await spec.isSatisfiedBy(command);
      expect(result).toBe(true);
    });

    it.each(groupCreationInvalidTestCases)(
      "should throw error for %s",
      async (description, command) => {
        const spec = new GroupCreationValidSpecification(mockSupabase);
        await expect(spec.isSatisfiedBy(command)).rejects.toThrow("Invalid group creation parameters");
      }
    );

    it("should throw CurrencyNotFoundError when currency does not exist", async () => {
      // Arrange
      const specFixture = createBasicSpecTestFixture(
        GroupCreationValidSpecification,
        currencySpecFixtures.notExists
      );
      const spec = specFixture.setup(mockSupabase);
      const command = createValidGroupCreationCommand({ base_currency_code: TEST_INVALID_CURRENCY_CODE });

      // Act & Assert
      await expect(spec.isSatisfiedBy(command)).rejects.toThrow(CurrencyNotFoundError);
    });
  });

  describe("Specification Method Chaining", () => {
    const baseSpecFixture = createSyncSpecTestFixture(GroupNameValidSpecification);
    const baseSpec = baseSpecFixture.setup();
    const otherSpecFixture = createSyncSpecTestFixture(GroupBaseCurrencyValidSpecification);
    const otherSpec = otherSpecFixture.setup();

    it("should chain 'and' method fluently", async () => {
      // Act
      const chainedSpec = baseSpec.and(otherSpec);
      const result = await chainedSpec.isSatisfiedBy("Test Group");

      // Assert
      expect(result).toBe(true);
      expect(chainedSpec).toBeInstanceOf(AndSpecification);
    });

    it("should chain 'or' method fluently", async () => {
      // Act
      const chainedSpec = baseSpec.or(otherSpec);
      const result = await chainedSpec.isSatisfiedBy("Test Group");

      // Assert
      expect(result).toBe(true);
      expect(chainedSpec).toBeInstanceOf(OrSpecification);
    });

    it("should chain 'not' method fluently", async () => {
      // Act
      const chainedSpec = baseSpec.not();
      const result = await chainedSpec.isSatisfiedBy("Test Group");

      // Assert
      expect(result).toBe(false);
      expect(chainedSpec).toBeInstanceOf(NotSpecification);
    });
  });
});
