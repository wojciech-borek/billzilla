# Test Cases for useCreateGroupMutation Hook

## UT-CGM-001: Initial State

**Nazwa testu**: should_return_initial_state_when_hook_is_created
**Moduł / funkcja**: useCreateGroupMutation
**Cel testu**: Verify that the hook returns correct initial state when first called
**Wejście / dane testowe**: None (hook instantiation)
**Setup / izolacja**: Render hook using React Testing Library
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Import and render the hook
2. Act: Call useCreateGroupMutation()
3. Assert: Check that returned object contains isLoading: false, error: null, fieldErrors: null
   **Oczekiwany rezultat**: Initial state object with all values set to defaults
   **Priorytet**: Wysoki
   **Edge cases**: None
   **Notatki / uwagi**: Basic sanity check for hook initialization

## UT-CGM-002: Successful Group Creation

**Nazwa testu**: should_create_group_successfully_with_valid_data
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify successful group creation with valid form data
**Wejście / dane testowe**:

```typescript
const formValues = {
  name: "Test Group",
  base_currency_code: "PLN",
  invite_emails: ["user@example.com", "USER2@EXAMPLE.COM"],
};
const mockResponse = { id: "123", name: "Test Group", base_currency_code: "PLN" };
```

**Setup / izolacja**: Mock fetch API, spy on setState
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return success response, render hook
2. Act: Call createGroup with valid form values
3. Assert: Verify fetch was called with correct URL, method, headers, and transformed body
4. Assert: Verify state was updated to loading: false, error: null, fieldErrors: null
5. Assert: Verify function returns the response data
   **Oczekiwany rezultat**: Group created successfully, state updated correctly, response returned
   **Priorytet**: Wysoki
   **Edge cases**: None
   **Notatki / uwagi**: Tests main happy path functionality

## UT-CGM-003: Input Data Transformation

**Nazwa testu**: should_transform_input_data_correctly
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify that form values are correctly transformed before API call
**Wejście / dane testowe**:

```typescript
const formValues = {
  name: "  Test Group  ",
  base_currency_code: "USD",
  invite_emails: ["  USER@EXAMPLE.COM  ", "user2@example.com"],
};
```

**Setup / izolacja**: Mock fetch, spy on fetch calls
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return success, render hook
2. Act: Call createGroup with form values containing whitespace
3. Assert: Verify fetch body contains trimmed name and lowercased emails
   **Oczekiwany rezultat**: Request body has name: "Test Group", invite_emails: ["user@example.com", "user2@example.com"]
   **Priorytet**: Średni
   **Edge cases**: Extra whitespace in name and emails
   **Notatki / uwagi**: Tests data sanitization logic

## UT-CGM-004: Empty Invite Emails Handling

**Nazwa testu**: should_handle_empty_invite_emails_array
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify that empty invite_emails array is handled correctly
**Wejście / dane testowe**:

```typescript
const formValues = {
  name: "Test Group",
  base_currency_code: "EUR",
  invite_emails: [],
};
```

**Setup / izolacja**: Mock fetch, spy on fetch calls
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return success, render hook
2. Act: Call createGroup with empty invite_emails array
3. Assert: Verify request body has invite_emails: undefined
   **Oczekiwany rezultat**: invite_emails field is omitted from request body when array is empty
   **Priorytet**: Średni
   **Edge cases**: Empty array vs undefined/null
   **Notatki / uwagi**: Tests edge case for optional invite emails

## UT-CGM-005: Loading State Management

**Nazwa testu**: should_manage_loading_state_during_request
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify loading state is correctly managed during API call
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Mock fetch with delayed response, spy on setState calls
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return success after delay, render hook
2. Act: Call createGroup
3. Assert: Verify setState was called with isLoading: true initially
4. Assert: Verify setState was called with isLoading: false on completion
   **Oczekiwany rezultat**: Loading state transitions from false → true → false
   **Priorytet**: Średni
   **Edge cases**: Network delays, slow responses
   **Notatki / uwagi**: Tests state management during async operations

## UT-CGM-006: 401 Unauthorized Error Handling

**Nazwa testu**: should_handle_401_unauthorized_error
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify proper handling of 401 unauthorized response
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Mock fetch to return 401 status
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return 401 status, render hook
2. Act: Call createGroup
3. Assert: Verify state updated with error message "Nie jesteś zalogowany. Zaloguj się ponownie."
4. Assert: Verify function throws the error
   **Oczekiwany rezultat**: Polish error message for authentication failure
   **Priorytet**: Wysoki
   **Edge cases**: None
   **Notatki / uwagi**: Tests authentication error handling

## UT-CGM-007: 400/422 Validation Error with Field Errors

**Nazwa testu**: should_handle_validation_error_with_field_details
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify handling of validation errors with field-specific details
**Wejście / dane testowe**:

```typescript
const errorResponse = {
  error: {
    message: "Validation failed",
    details: { name: "Name is required", invite_emails: "Invalid email format" },
  },
};
```

**Setup / izolacja**: Mock fetch to return 400 status with error details
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return 400 with detailed error response, render hook
2. Act: Call createGroup
3. Assert: Verify state.fieldErrors contains the field error mapping
4. Assert: Verify state.error contains the main error message
5. Assert: Verify function throws error with correct message
   **Oczekiwany rezultat**: Field errors are extracted and stored in state
   **Priorytet**: Wysoki
   **Edge cases**: Missing details field, malformed error structure
   **Notatki / uwagi**: Tests complex error response parsing

## UT-CGM-008: 400/422 Validation Error without Details

**Nazwa testu**: should_handle_validation_error_without_field_details
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify handling of validation errors without field details
**Wejście / dane testowe**:

```typescript
const errorResponse = {
  error: { message: "Invalid data" },
};
```

**Setup / izolacja**: Mock fetch to return 422 status without details
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return 422 with simple error response, render hook
2. Act: Call createGroup
3. Assert: Verify state.fieldErrors is null
4. Assert: Verify error thrown with "Nieprawidłowe dane formularza" message
   **Oczekiwany rezultat**: Fallback error message when no details provided
   **Priorytet**: Średni
   **Edge cases**: Missing error.message field
   **Notatki / uwagi**: Tests error handling fallback logic

## UT-CGM-009: 500 Server Error Handling

**Nazwa testu**: should_handle_500_server_error
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify proper handling of 500 server errors
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Mock fetch to return 500 status
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return 500 status, render hook
2. Act: Call createGroup
3. Assert: Verify error thrown with "Wystąpił błąd serwera. Spróbuj ponownie później." message
   **Oczekiwany rezultat**: Polish server error message
   **Priorytet**: Średni
   **Edge cases**: None
   **Notatki / uwagi**: Tests server error handling

## UT-CGM-010: Generic Error Handling

**Nazwa testu**: should_handle_generic_error_responses
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify handling of unexpected HTTP status codes
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Mock fetch to return 403 status
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return 403 status, render hook
2. Act: Call createGroup
3. Assert: Verify error thrown with "Nie udało się utworzyć grupy" message
   **Oczekiwany rezultat**: Generic error message for unhandled status codes
   **Priorytet**: Średni
   **Edge cases**: Various HTTP status codes not explicitly handled
   **Notatki / uwagi**: Tests default error case

## UT-CGM-011: Network Error Handling

**Nazwa testu**: should_handle_network_errors
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify handling of network failures and fetch errors
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Mock fetch to throw network error
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to throw Error("Network Error"), render hook
2. Act: Call createGroup
3. Assert: Verify state updated with the network error
4. Assert: Verify function throws the network error
   **Oczekiwany rezultat**: Network errors are propagated correctly
   **Priorytet**: Wysoki
   **Edge cases**: Connection timeouts, DNS failures
   **Notatki / uwagi**: Tests error handling for network issues

## UT-CGM-012: Malformed Response Handling

**Nazwa testu**: should_handle_malformed_json_response
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify handling of invalid JSON responses
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Mock fetch to return invalid JSON
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return invalid JSON string, render hook
2. Act: Call createGroup
3. Assert: Verify error is thrown and state updated
   **Oczekiwany rezultat**: JSON parsing errors are handled gracefully
   **Priorytet**: Średni
   **Edge cases**: Corrupted response data, unexpected response format
   **Notatki / uwagi**: Tests response parsing error handling

## UT-CGM-013: Reset Functionality

**Nazwa testu**: should_reset_state_to_initial_values
**Moduł / funkcja**: useCreateGroupMutation.reset
**Cel testu**: Verify that reset function clears all state
**Wejście / dane testowe**: None
**Setup / izolacja**: Set hook state to error/loading state, then call reset
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Simulate error state in hook
2. Act: Call reset function
3. Assert: Verify state returns to isLoading: false, error: null, fieldErrors: null
   **Oczekiwany rezultat**: All state properties reset to initial values
   **Priorytet**: Średni
   **Edge cases**: Resetting from various error states
   **Notatki / uwagi**: Tests state reset functionality

## UT-CGM-014: Error State Persistence on Failure

**Nazwa testu**: should_preserve_error_state_on_failure
**Moduł / funkcja**: useCreateGroupMutation
**Cel testu**: Verify that error state persists after failed operations
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Mock fetch to return error response
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Mock fetch to return 400 error, render hook
2. Act: Call createGroup and let it fail
3. Assert: Verify error and fieldErrors remain in state after operation
   **Oczekiwany rezultat**: Error state persists until reset or successful operation
   **Priorytet**: Średni
   **Edge cases**: Multiple consecutive failures
   **Notatki / uwagi**: Tests that errors don't clear automatically

## UT-CGM-015: Successful Operation Clears Previous Errors

**Nazwa testu**: should_clear_previous_errors_on_success
**Moduł / funkcja**: useCreateGroupMutation.createGroup
**Cel testu**: Verify that successful operations clear previous error state
**Wejście / dane testowe**: Valid form values
**Setup / izolacja**: Set hook to error state, then perform successful operation
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Simulate previous error state, mock successful fetch
2. Act: Call createGroup successfully
3. Assert: Verify error and fieldErrors are cleared to null
   **Oczekiwany rezultat**: Success clears all previous errors
   **Priorytet**: Średni
   **Edge cases**: Success after multiple failures
   **Notatki / uwagi**: Tests error state cleanup on success
