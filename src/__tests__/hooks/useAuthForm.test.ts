import { describe, it, expect } from "vitest";
import { act } from "@testing-library/react";
import { useAuthForm } from "../../lib/hooks/useAuthForm";
import {
  commonSchemas,
  createValidData,
  createInvalidData,
  setupFormHook,
  validateHook,
  setHookLoading,
  setHookApiError,
  resetHook,
  cleanupHook,
  createSchemaWithMultipleRules,
  TEST_EMAIL,
  TEST_PASSWORD,
} from "./testHelpers";

describe("useAuthForm", () => {
  let hook: ReturnType<typeof setupFormHook>;

  afterEach(() => {
    if (hook) cleanupHook(hook);
  });

  describe("Initial State", () => {
    describe("UT-useAuthForm-001: should_initialize_with_empty_state_when_created", () => {
      it("should initialize with correct default values", () => {
        hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));
        expect(hook.result.current.formData).toEqual({});
        expect(hook.result.current.errors).toEqual({});
        expect(hook.result.current.isLoading).toBe(false);
        expect(hook.result.current.apiError).toBe(null);
      });
    });

    describe("UT-useAuthForm-002: should_return_valid_formdata_as_typed_when_all_fields_set", () => {
      it("should return formData typed as full schema type when all fields are set", () => {
        hook = setupFormHook(() => useAuthForm(commonSchemas.emailPassword), createValidData("emailPassword"));

        // Assert - formData should be typed as the full schema type (not Partial<T>)
        const formData = hook.result.current.formData;
        expect(formData).toEqual(createValidData("emailPassword"));

        // TypeScript should allow access to all properties without optional chaining
        expect(formData.email).toBe(TEST_EMAIL);
        expect(formData.password).toBe(TEST_PASSWORD);

        // Verify the type assertion works correctly - formData should have the correct properties
        expect(formData).toHaveProperty("email");
        expect(formData).toHaveProperty("password");
      });
    });
  });

  describe("Validation", () => {
    describe("Basic validation scenarios", () => {
      it.each([
        {
          name: "UT-useAuthForm-003: should_validate_successfully_when_formdata_matches_schema",
          schemaKey: "emailOnly" as const,
          useValidData: true,
          expected: true,
          expectedErrors: {},
        },
        {
          name: "UT-useAuthForm-004: should_set_field_errors_when_validation_fails",
          schemaKey: "emailOnly" as const,
          useValidData: false,
          expected: false,
          expectedErrors: { email: expect.any(String) },
        },
      ])("$name", ({ schemaKey, useValidData, expected, expectedErrors }) => {
        const data = useValidData ? createValidData(schemaKey) : createInvalidData(schemaKey);
        hook = setupFormHook(() => useAuthForm(commonSchemas[schemaKey]), data);

        const validationResult = validateHook(hook);

        expect(validationResult).toBe(expected);
        expect(hook.result.current.errors).toEqual(expectedErrors);
      });
    });

    describe("UT-useAuthForm-005: should_clear_previous_errors_when_validation_succeeds_after_failure", () => {
      it("should clear previous validation errors when validation succeeds", () => {
        hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly), createInvalidData("emailOnly"));

        // First validation should fail and set errors
        expect(validateHook(hook)).toBe(false);
        expect(hook.result.current.errors).toHaveProperty("email");

        // Now set valid data
        act(() => {
          hook.result.current.handleChange("email", TEST_EMAIL);
        });

        // Second validation should succeed and clear errors
        expect(validateHook(hook)).toBe(true);
        expect(hook.result.current.errors).toEqual({});
      });
    });
  });

  describe("Form Interactions", () => {
    describe("handleChange behavior", () => {
      describe("UT-useAuthForm-006: should_update_formdata_when_handlechange_called", () => {
        it("should update form data with new field value when handleChange is called", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.emailPassword));

          // Initial formData should be empty
          expect(hook.result.current.formData).toEqual({});

          // Act
          act(() => {
            hook.result.current.handleChange("email", "new@email.com");
          });

          // Assert
          expect(hook.result.current.formData.email).toBe("new@email.com");
        });
      });

      describe("UT-useAuthForm-007: should_clear_field_error_when_handlechange_updates_field_with_error", () => {
        it("should clear only the specific field error when that field is updated", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.fullForm), createInvalidData("fullForm"));

          // Validate to create errors
          validateHook(hook);
          expect(hook.result.current.errors).toHaveProperty("email");
          expect(hook.result.current.errors).toHaveProperty("password");
          expect(hook.result.current.errors).toHaveProperty("name");

          // Act - update only the email field
          act(() => {
            hook.result.current.handleChange("email", TEST_EMAIL);
          });

          // Assert - only email error should be cleared, others should remain
          expect(hook.result.current.errors.email).toBeUndefined();
          expect(hook.result.current.errors).toHaveProperty("password");
          expect(hook.result.current.errors).toHaveProperty("name");
        });
      });

      describe("UT-useAuthForm-008: should_clear_api_error_when_handlechange_called", () => {
        it("should clear API error when any field is changed", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

          // Set API error manually
          setHookApiError(hook, "Server error");
          expect(hook.result.current.apiError).toBe("Server error");

          // Act - call handleChange on any field
          act(() => {
            hook.result.current.handleChange("email", "any-value");
          });

          // Assert - API error should be cleared
          expect(hook.result.current.apiError).toBe(null);
        });
      });

      describe("UT-useAuthForm-014: should_handle_empty_string_values_in_formdata", () => {
        it("should correctly store empty string values in formData", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.emailPassword), createValidData("emailPassword"));

          // Verify values are set
          expect(hook.result.current.formData.email).toBe(TEST_EMAIL);
          expect(hook.result.current.formData.password).toBe(TEST_PASSWORD);

          // Act - update email to empty string
          act(() => {
            hook.result.current.handleChange("email", "");
          });

          // Assert - email should be empty string, password should remain unchanged
          expect(hook.result.current.formData.email).toBe("");
          expect(hook.result.current.formData.password).toBe(TEST_PASSWORD);

          // Act - update password to empty string as well
          act(() => {
            hook.result.current.handleChange("password", "");
          });

          // Assert - both fields should be empty strings
          expect(hook.result.current.formData.email).toBe("");
          expect(hook.result.current.formData.password).toBe("");
        });
      });
    });

    describe("State Management", () => {
      describe("Reset functionality", () => {
        describe("UT-useAuthForm-009: should_reset_form_data_when_reset_called", () => {
          it("should reset formData to empty object when reset is called", () => {
            hook = setupFormHook(() => useAuthForm(commonSchemas.fullForm), createValidData("fullForm"));

            expect(hook.result.current.formData).toEqual(createValidData("fullForm"));

            resetHook(hook);

            expect(hook.result.current.formData).toEqual({});
          });
        });

        describe("UT-useAuthForm-009b: should_reset_errors_when_reset_called", () => {
          it("should reset errors to empty object when reset is called", () => {
            hook = setupFormHook(() => useAuthForm(commonSchemas.fullForm), createInvalidData("fullForm"));

            validateHook(hook);
            expect(Object.keys(hook.result.current.errors)).toHaveLength(3); // email, password, name

            resetHook(hook);

            expect(hook.result.current.errors).toEqual({});
          });
        });

        describe("UT-useAuthForm-009c: should_reset_api_error_when_reset_called", () => {
          it("should reset apiError to null when reset is called", () => {
            hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

            setHookApiError(hook, "API Error");
            expect(hook.result.current.apiError).toBe("API Error");

            resetHook(hook);

            expect(hook.result.current.apiError).toBe(null);
          });
        });

        describe("UT-useAuthForm-009d: should_reset_loading_state_when_reset_called", () => {
          it("should reset isLoading to false when reset is called", () => {
            hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

            setHookLoading(hook, true);
            expect(hook.result.current.isLoading).toBe(true);

            resetHook(hook);

            expect(hook.result.current.isLoading).toBe(false);
          });
        });
      });

      describe("Manual state setters", () => {
        describe("UT-useAuthForm-010: should_allow_manual_setting_of_isloading", () => {
          it("should allow manual setting of isLoading state", () => {
            hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

            // Initial isLoading should be false
            expect(hook.result.current.isLoading).toBe(false);

            // Act - set isLoading to true
            setHookLoading(hook, true);
            expect(hook.result.current.isLoading).toBe(true);

            // Act - set isLoading back to false
            setHookLoading(hook, false);
            expect(hook.result.current.isLoading).toBe(false);
          });
        });

        describe("UT-useAuthForm-011: should_allow_manual_setting_of_apierror", () => {
          it("should allow manual setting of apiError state", () => {
            hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

            // Initial apiError should be null
            expect(hook.result.current.apiError).toBe(null);

            // Act - set apiError to a string
            setHookApiError(hook, "Network error");
            expect(hook.result.current.apiError).toBe("Network error");

            // Act - set apiError back to null
            setHookApiError(hook, null);
            expect(hook.result.current.apiError).toBe(null);
          });
        });
      });
    });

    describe("Advanced Validation", () => {
      describe("UT-useAuthForm-012: should_handle_nested_object_validation_errors", () => {
        it("should handle validation errors for nested schema structures", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.nestedForm));

          // Set invalid nested data
          act(() => {
            hook.result.current.handleChange("user", { name: "", email: "invalid-email" });
          });

          // Validate
          const validationResult = validateHook(hook);
          expect(validationResult).toBe(false);

          // The current implementation only uses err.path[0], so it should set error on "user"
          expect(hook.result.current.errors).toHaveProperty("user");
          expect(hook.result.current.errors.user).toBeDefined();
          expect(typeof hook.result.current.errors.user).toBe("string");
        });
      });

      describe("UT-useAuthForm-013: should_preserve_other_errors_when_clearing_single_field_error", () => {
        it("should preserve other field errors when clearing a single field error", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.fullForm), createInvalidData("fullForm"));

          // Validate to create errors
          validateHook(hook);
          expect(hook.result.current.errors).toHaveProperty("email");
          expect(hook.result.current.errors).toHaveProperty("password");
          expect(hook.result.current.errors).toHaveProperty("name");

          // Act - update only the email field
          act(() => {
            hook.result.current.handleChange("email", TEST_EMAIL);
          });

          // Assert - only email error should be cleared, others should remain
          expect(hook.result.current.errors.email).toBeUndefined();
          expect(hook.result.current.errors).toHaveProperty("password");
          expect(hook.result.current.errors).toHaveProperty("name");
        });
      });

      describe("UT-useAuthForm-015: should_validate_optional_fields_with_constraints", () => {
        it("should set validation errors for optional fields that fail validation rules", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.optionalFields));

          // Set data - valid name, valid optional email (empty), invalid optional phone
          act(() => {
            hook.result.current.handleChange("name", "John");
            hook.result.current.handleChange("email", ""); // Optional field, empty is fine
            hook.result.current.handleChange("phone", "123"); // Optional field but fails min length validation
          });

          // Validate
          const validationResult = validateHook(hook);
          expect(validationResult).toBe(false);

          // Phone error should be set even though it's optional (because it has validation rules that failed)
          expect(hook.result.current.errors).toHaveProperty("phone");
          expect(hook.result.current.errors.phone).toBeDefined();

          // Name and email should not have errors
          expect(hook.result.current.errors.name).toBeUndefined();
          expect(hook.result.current.errors.email).toBeUndefined();
        });
      });
    });

    describe("Edge Cases", () => {
      describe("Empty form validation", () => {
        it("should fail validation when required fields are empty", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

          // Don't set any data - formData remains empty
          const validationResult = validateHook(hook);
          expect(validationResult).toBe(false);
          expect(hook.result.current.errors).toHaveProperty("email");
        });
      });

      describe("Partial form data validation", () => {
        it("should fail validation when only some required fields are set", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.emailPassword));

          // Set only email, leave password empty
          act(() => {
            hook.result.current.handleChange("email", TEST_EMAIL);
            // password remains undefined
          });

          const validationResult = validateHook(hook);
          expect(validationResult).toBe(false);
          expect(hook.result.current.errors).toHaveProperty("password");
        });
      });

      describe("Type coercion edge cases", () => {
        it("should handle non-string values in form data", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

          // Set numeric value (should be coerced to string)
          act(() => {
            hook.result.current.handleChange("email", 123);
          });

          expect(hook.result.current.formData.email).toBe(123);
        });

        it("should handle null and undefined values", () => {
          hook = setupFormHook(() => useAuthForm(commonSchemas.emailOnly));

          // Set null value
          act(() => {
            hook.result.current.handleChange("email", null);
          });
          expect(hook.result.current.formData.email).toBe(null);

          // Set undefined value
          act(() => {
            hook.result.current.handleChange("email", undefined);
          });
          expect(hook.result.current.formData.email).toBe(undefined);
        });
      });

      describe("Multiple validation errors on same field", () => {
        it("should handle multiple validation rules failing on the same field", () => {
          const schemaWithMultipleRules = createSchemaWithMultipleRules();
          hook = setupFormHook(() => useAuthForm(schemaWithMultipleRules));

          // Set value that fails both rules (too short and invalid email)
          act(() => {
            hook.result.current.handleChange("email", "a@b.c"); // Too short and invalid format
          });

          const validationResult = validateHook(hook);
          expect(validationResult).toBe(false);
          expect(hook.result.current.errors).toHaveProperty("email");
        });
      });
    });
  });
});
