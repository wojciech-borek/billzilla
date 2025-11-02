import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseRepository } from "../../../lib/services/repositories/ExpenseRepository";
import {
  setupRepositoryTest,
  mockExpenseRepositoryQuery,
  mockMembershipVerification,
  createMockExpenseGroup,
  createMockExpenseActiveMembers,
  createMockCompleteExpense,
} from "../testHelpers";

describe("ExpenseRepository", () => {
  let mockSupabaseClient: ReturnType<typeof setupRepositoryTest>["mockSupabaseClient"];
  let expenseRepository: ExpenseRepository;

  beforeEach(() => {
    const testSetup = setupRepositoryTest(ExpenseRepository);
    mockSupabaseClient = testSetup.mockSupabaseClient;
    expenseRepository = testSetup.repository;
  });

  describe("fetchGroupMembershipAndCurrencies", () => {
    it("should return group membership and currencies when user is active member", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const mockGroupData = createMockExpenseGroup();

      mockExpenseRepositoryQuery(mockSupabaseClient, "groups", {
        data: mockGroupData,
        error: null,
      });

      // Act
      const result = await expenseRepository.fetchGroupMembershipAndCurrencies(groupId, userId);

      // Assert
      expect(result).toEqual(mockGroupData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("groups");
    });

    it("should throw error when user not active member", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "inactive-user";

      mockExpenseRepositoryQuery(mockSupabaseClient, "groups", {
        data: null,
        error: { message: "No data found" },
      });

      // Act & Assert
      await expect(expenseRepository.fetchGroupMembershipAndCurrencies(groupId, userId)).rejects.toThrow(
        "Group not found or user is not an active member"
      );
    });
  });

  describe("fetchActiveGroupMembers", () => {
    it("should return active group members successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const mockMembers = createMockExpenseActiveMembers();

      const queryBuilder = mockExpenseRepositoryQuery(mockSupabaseClient, "group_members", {
        data: mockMembers,
        error: null,
      });

      // Mock the chained eq calls for status filter
      queryBuilder.eq.mockReturnValueOnce(queryBuilder);
      queryBuilder.eq.mockResolvedValueOnce({
        data: mockMembers,
        error: null,
      });

      // Act
      const result = await expenseRepository.fetchActiveGroupMembers(groupId);

      // Assert
      expect(result).toEqual(mockMembers);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
    });
  });

  describe("createExpense", () => {
    it("should create expense and return id", async () => {
      // Arrange
      const expenseData = {
        group_id: "group-123",
        description: "Lunch at restaurant",
        amount: 50.0,
        currency_code: "USD",
        expense_date: "2024-01-15T10:00",
        created_by: "user-456",
        payer_id: "user-456",
      };
      const expectedResult = { id: "expense-uuid" };

      mockExpenseRepositoryQuery(mockSupabaseClient, "expenses", {
        data: expectedResult,
        error: null,
      });

      // Act
      const result = await expenseRepository.createExpense(expenseData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
    });
  });

  describe("createExpenseSplits", () => {
    it("should create expense splits successfully", async () => {
      // Arrange
      const splits = [
        { expense_id: "expense-123", profile_id: "user-1", amount: 25.0 },
        { expense_id: "expense-123", profile_id: "user-2", amount: 25.0 },
      ];

      const queryBuilder = mockExpenseRepositoryQuery(mockSupabaseClient, "expense_splits", {
        data: null,
        error: null,
      });
      queryBuilder.insert.mockResolvedValue({ error: null });

      // Act & Assert
      await expect(expenseRepository.createExpenseSplits(splits)).resolves.toBeUndefined();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expense_splits");
    });
  });

  describe("fetchCompleteExpense", () => {
    it("should fetch complete expense with all data", async () => {
      // Arrange
      const expenseId = "expense-123";
      const mockExpenseData = createMockCompleteExpense();

      mockExpenseRepositoryQuery(mockSupabaseClient, "expenses", {
        data: mockExpenseData,
        error: null,
      });

      // Act
      const result = await expenseRepository.fetchCompleteExpense(expenseId);

      // Assert
      expect(result).toEqual(mockExpenseData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
    });
  });

  describe("deleteExpense", () => {
    it("should delete expense successfully", async () => {
      // Arrange
      const expenseId = "expense-123";

      const queryBuilder = mockExpenseRepositoryQuery(mockSupabaseClient, "expenses", {
        data: null,
        error: null,
      });
      queryBuilder.delete.mockReturnThis();
      queryBuilder.eq.mockResolvedValue({});

      // Act & Assert
      await expect(expenseRepository.deleteExpense(expenseId)).resolves.toBeUndefined();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
    });
  });

  describe("fetchGroupExpenses", () => {
    it("should fetch group expenses with pagination", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const options = { limit: 10, offset: 0 };
      const mockExpenses = [
        { id: "expense-1", description: "Expense 1" },
        { id: "expense-2", description: "Expense 2" },
      ];

      // Mock membership verification first
      mockMembershipVerification(mockSupabaseClient, true);

      // Mock expenses query second
      mockExpenseRepositoryQuery(mockSupabaseClient, "expenses", {
        data: mockExpenses,
        error: null,
      });

      // Act
      const result = await expenseRepository.fetchGroupExpenses(groupId, userId, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("expense-1");
      expect(result[1].id).toBe("expense-2");
    });
  });
});
