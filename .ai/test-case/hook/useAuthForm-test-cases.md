# Unit Test Cases for useAuthForm Hook

## UT-useAuthForm-001
**Nazwa testu:** should_initialize_with_empty_state_when_created
**Moduł / funkcja:** useAuthForm (initial state)
**Cel testu:** Verify that the hook initializes with correct default values
**Wejście / dane testowe:** schema: any valid ZodSchema
**Setup / izolacja:** Render hook with useAuthForm(schema)
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Create a simple ZodSchema (e.g., z.object({ name: z.string() }))
- Act: Call useAuthForm with the schema
- Assert: Check formData is empty object, errors is empty object, isLoading is false, apiError is null
**Oczekiwany rezultat:** All state properties have correct initial values
**Priorytet:** High
**Edge cases:** N/A
**Notatki / uwagi:** Basic initialization test

## UT-useAuthForm-002
**Nazwa testu:** should_return_valid_formdata_as_typed_when_all_fields_set
**Moduł / funkcja:** useAuthForm (formData typing)
**Cel testu:** Verify that formData is properly typed and returned as full T type
**Wejście / dane testowe:** schema: z.object({ email: z.string(), password: z.string() })
**Setup / izolacja:** Render hook with partial data set
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Set formData to { email: "test@test.com", password: "pass123" }
- Act: Access formData property
- Assert: formData is typed as the full schema type (not Partial<T>)
**Oczekiwany rezultat:** TypeScript typing works correctly for complete form data
**Priorytet:** High
**Edge cases:** N/A
**Notatki / uwagi:** Tests the type assertion behavior

## UT-useAuthForm-003
**Nazwa testu:** should_validate_successfully_when_formdata_matches_schema
**Moduł / funkcja:** useAuthForm.validate
**Cel testu:** Verify validation passes for valid data
**Wejście / dane testowe:** schema: z.object({ email: z.string().email() }), formData: { email: "test@example.com" }
**Setup / izolacja:** Set formData with valid data
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Set formData to valid data matching schema
- Act: Call validate()
- Assert: Returns true, errors object is empty
**Oczekiwany rezultat:** Validation succeeds and clears any previous errors
**Priorytet:** High
**Edge cases:** N/A
**Notatki / uwagi:** Happy path validation

## UT-useAuthForm-004
**Nazwa testu:** should_set_field_errors_when_validation_fails
**Moduł / funkcja:** useAuthForm.validate
**Cel testu:** Verify validation sets appropriate errors for invalid data
**Wejście / dane testowe:** schema: z.object({ email: z.string().email() }), formData: { email: "invalid-email" }
**Setup / izolacja:** Set formData with invalid data
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Set formData with data that fails schema validation
- Act: Call validate()
- Assert: Returns false, errors object contains field-specific error messages
**Oczekiwany rezultat:** Field errors are set with correct error messages from Zod
**Priorytet:** High
**Edge cases:** Multiple validation errors on different fields
**Notatki / uwagi:** Tests error setting behavior

## UT-useAuthForm-005
**Nazwa testu:** should_clear_previous_errors_when_validation_succeeds_after_failure
**Moduł / funkcja:** useAuthForm.validate
**Cel testu:** Verify errors are cleared when validation succeeds
**Wejście / dane testowe:** schema: z.object({ email: z.string().email() })
**Setup / izolacja:** Have validation errors, then provide valid data
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Set invalid data, call validate() (sets errors), then set valid data
- Act: Call validate() again
- Assert: Returns true, errors object is cleared
**Oczekiwany rezultat:** Previous validation errors are removed on successful validation
**Priorytet:** Medium
**Edge cases:** N/A
**Notatki / uwagi:** Tests error clearing behavior

## UT-useAuthForm-006
**Nazwa testu:** should_update_formdata_when_handlechange_called
**Moduł / funkcja:** useAuthForm.handleChange
**Cel testu:** Verify form data is updated correctly
**Wejście / dane testowe:** field: "email", value: "new@email.com"
**Setup / izolacja:** Start with empty formData
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Initial formData is empty
- Act: Call handleChange("email", "new@email.com")
- Assert: formData.email equals "new@email.com"
**Oczekiwany rezultat:** Form data is updated with new field value
**Priorytet:** High
**Edge cases:** Updating existing field value, adding new fields
**Notatki / uwagi:** Basic form data update functionality

## UT-useAuthForm-007
**Nazwa testu:** should_clear_field_error_when_handlechange_updates_field_with_error
**Moduł / funkcja:** useAuthForm.handleChange
**Cel testu:** Verify field-specific errors are cleared when field is updated
**Wejście / dane testowe:** field with existing error
**Setup / izolacja:** Set validation error for a field, then update that field
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Have errors["email"] set from previous validation
- Act: Call handleChange("email", "any-value")
- Assert: errors["email"] is undefined, other errors remain
**Oczekiwany rezultat:** Only the specific field error is cleared
**Priorytet:** High
**Edge cases:** Field not in errors object
**Notatki / uwagi:** Tests error clearing on field update

## UT-useAuthForm-008
**Nazwa testu:** should_clear_api_error_when_handlechange_called
**Moduł / funkcja:** useAuthForm.handleChange
**Cel testu:** Verify API error is cleared when any field changes
**Wejście / dane testowe:** Any field change
**Setup / izolacja:** Set apiError to some value
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Set apiError to "Server error"
- Act: Call handleChange on any field
- Assert: apiError is null
**Oczekiwany rezultat:** API error is cleared on any form field change
**Priorytet:** Medium
**Edge cases:** apiError already null
**Notatki / uwagi:** Tests API error clearing behavior

## UT-useAuthForm-009
**Nazwa testu:** should_reset_all_state_when_reset_called
**Moduł / funkcja:** useAuthForm.reset
**Cel testu:** Verify reset function clears all state
**Wejście / dane testowe:** All state properties have values
**Setup / izolacja:** Set formData, errors, apiError, isLoading to non-default values
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Populate all state properties with test data
- Act: Call reset()
- Assert: formData is {}, errors is {}, apiError is null, isLoading is false
**Oczekiwany rezultat:** All state is reset to initial values
**Priorytet:** High
**Edge cases:** N/A
**Notatki / uwagi:** Complete state reset functionality

## UT-useAuthForm-010
**Nazwa testu:** should_allow_manual_setting_of_isloading
**Moduł / funkcja:** useAuthForm.setIsLoading
**Cel testu:** Verify setIsLoading function works correctly
**Wejście / dane testowe:** boolean values
**Setup / izolacja:** Initial isLoading is false
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: isLoading starts as false
- Act: Call setIsLoading(true)
- Assert: isLoading equals true
**Oczekiwany rezultat:** isLoading state can be set manually
**Priorytet:** Low
**Edge cases:** Setting to same value
**Notatki / uwagi:** Tests manual loading state control

## UT-useAuthForm-011
**Nazwa testu:** should_allow_manual_setting_of_apierror
**Moduł / funkcja:** useAuthForm.setApiError
**Cel testu:** Verify setApiError function works correctly
**Wejście / dane testowe:** string and null values
**Setup / izolacja:** Initial apiError is null
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: apiError starts as null
- Act: Call setApiError("Error message")
- Assert: apiError equals "Error message"
**Oczekiwany rezultat:** apiError state can be set manually
**Priorytet:** Low
**Edge cases:** Setting to null, setting to same value
**Notatki / uwagi:** Tests manual API error state control

## UT-useAuthForm-012
**Nazwa testu:** should_handle_nested_object_validation_errors
**Moduł / funkcja:** useAuthForm.validate
**Cel testu:** Verify validation works with nested schema structures
**Wejście / dane testowe:** schema with nested objects
**Setup / izolacja:** Complex Zod schema with nested validation
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Use schema with nested objects and invalid data
- Act: Call validate()
- Assert: Nested field errors are set correctly in errors object
**Oczekiwany rezultat:** Nested validation errors are handled properly
**Priorytet:** Medium
**Edge cases:** Deeply nested objects, arrays in schema
**Notatki / uwagi:** Tests complex schema validation

## UT-useAuthForm-013
**Nazwa testu:** should_preserve_other_errors_when_clearing_single_field_error
**Moduł / funkcja:** useAuthForm.handleChange
**Cel testu:** Verify only specific field errors are cleared
**Wejście / dane testowe:** Multiple fields with errors
**Setup / izolacja:** Set errors for multiple fields
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: errors = { email: "Invalid", password: "Too short" }
- Act: Call handleChange("email", "newvalue")
- Assert: errors = { password: "Too short" } (only email error cleared)
**Oczekiwany rezultat:** Other field errors remain when clearing specific field
**Priorytet:** Medium
**Edge cases:** Clearing field that has no error
**Notatki / uwagi:** Tests selective error clearing

## UT-useAuthForm-014
**Nazwa testu:** should_handle_empty_string_values_in_formdata
**Moduł / funkcja:** useAuthForm.handleChange
**Cel testu:** Verify empty strings are handled correctly
**Wejście / dane testowe:** value: ""
**Setup / izolacja:** Update field with empty string
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Set field to non-empty value
- Act: Call handleChange with empty string
- Assert: formData field equals ""
**Oczekiwany rezultat:** Empty string values are stored correctly
**Priorytet:** Low
**Edge cases:** null, undefined values
**Notatki / uwagi:** Tests edge case input handling

## UT-useAuthForm-015
**Nazwa testu:** should_not_clear_errors_when_validation_fails_on_optional_fields
**Moduł / funkcja:** useAuthForm.validate
**Cel testu:** Verify error handling for optional field validation failures
**Wejście / dane testowe:** Schema with optional fields that fail validation
**Setup / izolacja:** Form with optional field validation errors
**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Schema with optional field that has validation rules, set invalid value
- Act: Call validate()
- Assert: Optional field errors are still set if validation fails
**Oczekiwany rezultat:** Optional fields still show validation errors when invalid
**Priorytet:** Medium
**Edge cases:** Mixed required and optional fields
**Notatki / uwagi:** Tests optional field validation behavior
