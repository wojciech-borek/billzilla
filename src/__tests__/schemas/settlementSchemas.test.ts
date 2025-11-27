/**
 * Tests for settlement schema validation
 */

import { describe, it, expect } from "vitest";
import { createSettlementSchema } from "../../lib/schemas/settlementSchemas";

describe("createSettlementSchema", () => {
  describe("valid input", () => {
    it("should validate successfully with valid settlement data", () => {
      const validData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: 50.25,
      };

      const result = createSettlementSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should validate successfully with minimum positive amount", () => {
      const validData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: 0.01,
      };

      const result = createSettlementSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(0.01);
      }
    });

    it("should validate successfully with maximum allowed amount", () => {
      const validData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: 1000000,
      };

      const result = createSettlementSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1000000);
      }
    });
  });

  describe("payer_id validation", () => {
    it("should reject invalid payer_id (not a UUID)", () => {
      const invalidData = {
        payer_id: "not-a-uuid",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: 50.25,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["payer_id"],
              message: "Invalid payer ID",
            }),
          ])
        );
      }
    });

    it("should reject empty payer_id", () => {
      const invalidData = {
        payer_id: "",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: 50.25,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["payer_id"],
              message: "Invalid payer ID",
            }),
          ])
        );
      }
    });
  });

  describe("payee_id validation", () => {
    it("should reject invalid payee_id (not a UUID)", () => {
      const invalidData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "not-a-uuid",
        amount: 50.25,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["payee_id"],
              message: "Invalid payee ID",
            }),
          ])
        );
      }
    });

    it("should reject empty payee_id", () => {
      const invalidData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "",
        amount: 50.25,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["payee_id"],
              message: "Invalid payee ID",
            }),
          ])
        );
      }
    });
  });

  describe("amount validation", () => {
    it("should reject zero amount", () => {
      const invalidData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: 0,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["amount"],
              message: "Amount must be positive",
            }),
          ])
        );
      }
    });

    it("should reject negative amount", () => {
      const invalidData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: -10,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["amount"],
              message: "Amount must be positive",
            }),
          ])
        );
      }
    });

    it("should reject amount exceeding maximum", () => {
      const invalidData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: 1000001,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["amount"],
              message: "Amount too large",
            }),
          ])
        );
      }
    });

    it("should reject non-numeric amount", () => {
      const invalidData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440001",
        amount: "50.25",
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["amount"],
              message: "Expected number, received string",
            }),
          ])
        );
      }
    });
  });

  describe("payer_id !== payee_id validation", () => {
    it("should reject when payer_id equals payee_id", () => {
      const invalidData = {
        payer_id: "550e8400-e29b-41d4-a716-446655440000",
        payee_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 50.25,
      };

      const result = createSettlementSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["payee_id"],
              message: "Payer and payee cannot be the same person",
            }),
          ])
        );
      }
    });
  });
});
