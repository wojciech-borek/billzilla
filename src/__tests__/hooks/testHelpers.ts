import { vi } from "vitest";
import { z, type ZodSchema } from "zod";
import { renderHook, act } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";

// =============================================================================
// TEST CONSTANTS
// =============================================================================

export const TEST_EMAIL = "test@example.com";
export const TEST_PASSWORD = "password123";
export const INVALID_EMAIL = "invalid-email";
export const SHORT_PASSWORD = "123";

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const commonSchemas = {
  emailOnly: z.object({ email: z.string().email() }),
  emailPassword: z.object({ email: z.string(), password: z.string() }),
  fullForm: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1)
  }),
  nestedForm: z.object({
    user: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email")
    })
  }),
  optionalFields: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().optional(),
    phone: z.string().min(10, "Phone must be at least 10 characters").optional()
  })
} as const;

// =============================================================================
// DATA BUILDERS
// =============================================================================

export const createValidData = (type: keyof typeof commonSchemas) => ({
  emailOnly: { email: TEST_EMAIL },
  emailPassword: { email: TEST_EMAIL, password: TEST_PASSWORD },
  fullForm: { email: TEST_EMAIL, password: TEST_PASSWORD, name: "John Doe" },
  nestedForm: { user: { name: "John", email: TEST_EMAIL } },
  optionalFields: { name: "John", email: TEST_EMAIL, phone: "1234567890" }
}[type]);

export const createInvalidData = (type: keyof typeof commonSchemas) => ({
  emailOnly: { email: INVALID_EMAIL },
  emailPassword: { email: INVALID_EMAIL, password: SHORT_PASSWORD },
  fullForm: { email: INVALID_EMAIL, password: SHORT_PASSWORD, name: "" },
  nestedForm: { user: { name: "", email: INVALID_EMAIL } },
  optionalFields: { name: "", email: "", phone: "123" }
}[type]);

// =============================================================================
// HOOK SETUP UTILITIES
// =============================================================================

/**
 * Sets up a form hook with optional initial data
 */
export const setupFormHook = <TData extends Record<string, unknown>>(
  useHook: () => any,
  initialData?: TData
): RenderHookResult<any, any> => {
  const hook = renderHook(() => useHook());

  if (initialData && Object.keys(initialData).length > 0) {
    act(() => {
      Object.entries(initialData).forEach(([field, value]) => {
        hook.result.current.handleChange(field, value);
      });
    });
  }

  return hook;
};

/**
 * Validates a form hook and returns the result
 */
export const validateHook = (hook: RenderHookResult<any, any>): boolean => {
  let result: boolean;
  act(() => {
    result = hook.result.current.validate();
  });
  return result!;
};

/**
 * Sets loading state on a form hook
 */
export const setHookLoading = (hook: RenderHookResult<any, any>, loading: boolean): void => {
  act(() => {
    hook.result.current.setIsLoading(loading);
  });
};

/**
 * Sets API error on a form hook
 */
export const setHookApiError = (hook: RenderHookResult<any, any>, error: string | null): void => {
  act(() => {
    hook.result.current.setApiError(error);
  });
};

/**
 * Resets a form hook
 */
export const resetHook = (hook: RenderHookResult<any, any>): void => {
  act(() => {
    hook.result.current.reset();
  });
};

// =============================================================================
// COMMON TEST PATTERNS
// =============================================================================

/**
 * Creates a schema with multiple validation rules for testing
 */
export const createSchemaWithMultipleRules = () => z.object({
  email: z.string().email().min(10, "Email must be at least 10 characters")
});

/**
 * Common cleanup utility for hook tests
 */
export const cleanupHook = (hook: RenderHookResult<any, any>): void => {
  hook.unmount();
};

/**
 * Waits for the next tick in tests (useful for async operations)
 */
export const waitForNextTick = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));
