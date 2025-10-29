# Test Cases: usePasswordReset Hook

## usePasswordReset Hook

### UT-USE-PASSWORD-RESET-001

**Nazwa testu**: should_initialize_with_default_states_when_hook_created

**Moduł / funkcja**: usePasswordReset hook initialization

**Cel testu**: Verify that the hook initializes with correct default state values

**Wejście / dane testowe**:

- Brak parametrów wejściowych

**Setup / izolacja**:

- Render hook without any setup
- No mocks needed for initial state

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Import usePasswordReset hook
- Act: const { isLoading, error, success } = renderHook(() => usePasswordReset())
- Assert: Verify isLoading is false, error is null, success is false

**Oczekiwany rezultat**:

- isLoading: false
- error: null
- success: false

**Priorytet**: High

**Edge cases**: N/A

**Notatki / uwagi**: Test fundamental hook behavior and state initialization

### UT-USE-PASSWORD-RESET-002

**Nazwa testu**: should_set_success_true_when_password_reset_request_succeeds

**Moduł / funkcja**: usePasswordReset.requestReset method

**Cel testu**: Verify that successful password reset request sets success state correctly

**Wejście / dane testowe**:

- email: "test@example.com"
- passwordResetService.requestPasswordReset returns: { success: true }

**Setup / izolacja**:

- Mock passwordResetService.requestPasswordReset to return { success: true }
- Render hook and call requestReset

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Mock passwordResetService to return success, render hook
- Act: Call requestReset("test@example.com") and wait for completion
- Assert: Verify success is true, error is null, isLoading is false, return value is true

**Oczekiwany rezultat**:

- Function returns true
- success state becomes true
- error state remains null
- isLoading state returns to false

**Priorytet**: High

**Edge cases**: Valid email format, service returns success

**Notatki / uwagi**: Test happy path for password reset request

### UT-USE-PASSWORD-RESET-003

**Nazwa testu**: should_set_error_when_password_reset_request_fails

**Moduł / funkcja**: usePasswordReset.requestReset method

**Cel testu**: Verify that failed password reset request sets error state correctly

**Wejście / dane testowe**:

- email: "test@example.com"
- passwordResetService.requestPasswordReset returns: { success: false, error: "Invalid email" }

**Setup / izolacja**:

- Mock passwordResetService.requestPasswordReset to return { success: false, error: "Invalid email" }
- Render hook and call requestReset

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Mock passwordResetService to return failure with error message, render hook
- Act: Call requestReset("test@example.com") and wait for completion
- Assert: Verify success is false, error is "Invalid email", isLoading is false, return value is false

**Oczekiwany rezultat**:

- Function returns false
- error state becomes "Invalid email"
- success state remains false
- isLoading state returns to false

**Priorytet**: High

**Edge cases**: Service returns error message

**Notatki / uwagi**: Test error handling for failed password reset

### UT-USE-PASSWORD-RESET-004

**Nazwa testu**: should_set_generic_error_when_service_returns_no_error_message

**Moduł / funkcja**: usePasswordReset.requestReset method

**Cel testu**: Verify fallback error message when service doesn't provide error details

**Wejście / dane testowe**:

- email: "test@example.com"
- passwordResetService.requestPasswordReset returns: { success: false }

**Setup / izolacja**:

- Mock passwordResetService.requestPasswordReset to return { success: false } (no error message)
- Render hook and call requestReset

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Mock passwordResetService to return { success: false } without error, render hook
- Act: Call requestReset("test@example.com") and wait for completion
- Assert: Verify error is "Wystąpił nieoczekiwany błąd", success is false, isLoading is false

**Oczekiwany rezultat**:

- error state becomes "Wystąpił nieoczekiwany błąd"
- success state remains false
- isLoading state returns to false

**Priorytet**: Medium

**Edge cases**: Service returns success: false without error message

**Notatki / uwagi**: Test fallback error message handling

### UT-USE-PASSWORD-RESET-005

**Nazwa testu**: should_manage_loading_state_during_request

**Moduł / funkcja**: usePasswordReset.requestReset method

**Cel testu**: Verify loading state transitions during async operation

**Wejście / dane testowe**:

- email: "test@example.com"
- passwordResetService.requestPasswordReset returns: { success: true } after delay

**Setup / izolacja**:

- Mock passwordResetService.requestPasswordReset to return success after simulated delay
- Render hook and monitor loading state

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Mock passwordResetService with delayed response, render hook
- Act: Call requestReset and check loading state at different points
- Assert: Verify isLoading becomes true during request and false after completion

**Oczekiwany rezultat**:

- isLoading is true during the async operation
- isLoading returns to false after completion

**Priorytet**: High

**Edge cases**: Async operation timing

**Notatki / uwagi**: Test loading state management for UX feedback

### UT-USE-PASSWORD-RESET-006

**Nazwa testu**: should_reset_all_states_when_reset_called

**Moduł / funkcja**: usePasswordReset.reset method

**Cel testu**: Verify that reset function clears all states to initial values

**Wejście / dane testowe**:

- Brak parametrów wejściowych
- Pre-condition: Hook in error state (error: "Some error", success: false, isLoading: false)

**Setup / izolacja**:

- Render hook and manually set states to simulate error condition
- Call reset function

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Render hook, set error state, success false, isLoading false
- Act: Call reset() function
- Assert: Verify all states return to initial values (isLoading: false, error: null, success: false)

**Oczekiwany rezultat**:

- isLoading: false
- error: null
- success: false

**Priorytet**: Medium

**Edge cases**: Reset from various state combinations

**Notatki / uwagi**: Test state reset functionality

### UT-USE-PASSWORD-RESET-007

**Nazwa testu**: should_clear_previous_error_when_new_request_starts

**Moduł / funkcja**: usePasswordReset.requestReset method

**Cel testu**: Verify that new requests clear previous error states

**Wejście / dane testowe**:

- First call: email: "invalid@example.com" (fails)
- Second call: email: "valid@example.com" (succeeds)

**Setup / izolacja**:

- Mock passwordResetService to fail first call, succeed second call
- Render hook

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Mock service to fail first request, succeed second, render hook
- Act: Call requestReset with invalid email (sets error), then call with valid email
- Assert: Verify error is cleared when second request starts, success is set after completion

**Oczekiwany rezultat**:

- Error state is cleared at the start of new request
- Previous error doesn't persist

**Priorytet**: Medium

**Edge cases**: Multiple sequential requests

**Notatki / uwagi**: Test state isolation between requests

### UT-USE-PASSWORD-RESET-008

**Nazwa testu**: should_clear_previous_success_when_new_request_starts

**Moduł / funkcja**: usePasswordReset.requestReset method

**Cel testu**: Verify that new requests clear previous success states

**Wejście / dane testowe**:

- First call: email: "valid@example.com" (succeeds)
- Second call: email: "another@example.com" (fails)

**Setup / izolacja**:

- Mock passwordResetService to succeed first call, fail second call
- Render hook

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Mock service to succeed first request, fail second, render hook
- Act: Call requestReset with valid email (sets success), then call with another email that fails
- Assert: Verify success is cleared when second request starts, error is set after completion

**Oczekiwany rezultat**:

- Success state is cleared at the start of new request
- Previous success doesn't persist

**Priorytet**: Medium

**Edge cases**: Multiple sequential requests with different outcomes

**Notatki / uwagi**: Test state isolation between requests

### UT-USE-PASSWORD-RESET-009

**Nazwa testu**: should_handle_service_throwing_exception

**Moduł / funkcja**: usePasswordReset.requestReset method

**Cel testu**: Verify error handling when passwordResetService throws an exception

**Wejście / dane testowe**:

- email: "test@example.com"
- passwordResetService.requestPasswordReset throws Error

**Setup / izolacja**:

- Mock passwordResetService.requestPasswordReset to throw an exception
- Render hook

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Mock passwordResetService to throw exception, render hook
- Act: Call requestReset and wait for completion
- Assert: Verify isLoading returns to false, error is set, success remains false

**Oczekiwany rezultat**:

- Exception is caught and handled gracefully
- Error state is set appropriately
- Loading state is properly reset

**Priorytet**: High

**Edge cases**: Service throws unexpected exceptions

**Notatki / uwagi**: Test exception handling and error recovery

### UT-USE-PASSWORD-RESET-010

**Nazwa testu**: should_maintain_state_isolation_between_multiple_hook_instances

**Moduł / funkcja**: usePasswordReset hook instances

**Cel testu**: Verify that multiple hook instances maintain separate state

**Wejście / dane testowe**:

- Two separate hook instances
- Different request outcomes for each

**Setup / izolacja**:

- Render two separate instances of the hook
- Mock service with different responses

**Kroki testowe (Arrange → Act → Assert)**:

- Arrange: Render two hook instances, mock service with different behaviors
- Act: Call requestReset on first hook (success), second hook (failure)
- Assert: Verify each hook maintains its own state independently

**Oczekiwany rezultat**:

- First hook: success = true, error = null
- Second hook: success = false, error = set
- States don't interfere with each other

**Priorytet**: Low

**Edge cases**: Multiple hook instances in same component tree

**Notatki / uwagi**: Test hook isolation and state encapsulation
