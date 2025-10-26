# useLogout Hook - Unit Test Cases

## UT-LOGOUT-001
**Nazwa testu:** should_return_logout_function_and_initial_loading_state_when_hook_initialized

**Moduł / funkcja:** useLogout hook initialization

**Cel testu:** Verify that the hook returns the logout function and initial isLoggingOut state

**Wejście / dane testowe:** Brak

**Setup / izolacja:** Mock useSupabaseAuth hook to return a mock supabase client

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Mock useSupabaseAuth to return mock supabase client
- Act: Call useLogout() hook
- Assert: Verify returned object contains logout function and isLoggingOut equals false

**Oczekiwany rezultat:** Hook returns object with logout function and isLoggingOut: false

**Priorytet:** High

**Edge cases:** Hook called multiple times should return consistent structure

**Notatki / uwagi:** Basic initialization test to ensure hook structure is correct

## UT-LOGOUT-002
**Nazwa testu:** should_successfully_logout_and_redirect_when_signout_succeeds

**Moduł / funkcja:** logout function - successful logout flow

**Cel testu:** Verify successful logout sets loading state, calls signOut, redirects to login, and returns success

**Wejście / dane testowe:** Mock supabase.auth.signOut returns { error: null }

**Setup / izolacja:** Mock useSupabaseAuth, mock window.location.assign, spy on setIsLoggingOut

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Mock supabase.auth.signOut to resolve with { error: null }, spy on window.location.assign
- Act: Call logout() function
- Assert: Verify setIsLoggingOut called with true initially, signOut called, window.location.assign called with "/login", returns { success: true, error: null }

**Oczekiwany rezultat:** Loading set to true, signOut called, redirect to /login, success returned

**Priorytet:** High

**Edge cases:** Verify loading state not reset on success (redirect happens before reset)

**Notatki / uwagi:** Tests the complete happy path of logout functionality

## UT-LOGOUT-003
**Nazwa testu:** should_handle_signout_error_and_reset_loading_state

**Moduł / funkcja:** logout function - error handling from supabase

**Cel testu:** Verify logout handles supabase errors properly by resetting loading and returning error

**Wejście / dane testowe:** Mock supabase.auth.signOut returns { error: new Error("Sign out failed") }

**Setup / izolacja:** Mock useSupabaseAuth, spy on setIsLoggingOut

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Mock supabase.auth.signOut to resolve with { error: mockError }, spy on setIsLoggingOut
- Act: Call logout() function
- Assert: Verify setIsLoggingOut called with true then false, signOut called, returns { success: false, error: mockError }, no redirect

**Oczekiwany rezultat:** Loading set to true then false, error returned, no redirect

**Priorytet:** High

**Edge cases:** Different types of error objects from supabase

**Notatki / uwagi:** Tests error handling from the supabase auth.signOut method

## UT-LOGOUT-004
**Nazwa testu:** should_handle_exceptions_and_reset_loading_state

**Moduł / funkcja:** logout function - exception handling

**Cel testu:** Verify logout catches and handles exceptions thrown during signOut

**Wejście / dane testowe:** Mock supabase.auth.signOut throws an exception

**Setup / izolacja:** Mock useSupabaseAuth, spy on setIsLoggingOut

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Mock supabase.auth.signOut to throw new Error("Network error"), spy on setIsLoggingOut
- Act: Call logout() function in try-catch
- Assert: Verify setIsLoggingOut called with true then false, returns { success: false, error: thrownError }, no redirect

**Oczekiwany rezultat:** Loading set to true then false, exception caught and returned as error

**Priorytet:** High

**Edge cases:** Different types of exceptions (network errors, auth errors, etc.)

**Notatki / uwagi:** Tests exception safety and proper cleanup of loading state

## UT-LOGOUT-005
**Nazwa testu:** should_maintain_loading_state_during_async_operation

**Moduł / funkcja:** logout function - loading state management

**Cel testu:** Verify loading state is properly managed during the async logout operation

**Wejście / dane testowe:** Mock supabase.auth.signOut with delayed resolution

**Setup / izolacja:** Mock useSupabaseAuth with async signOut, spy on setIsLoggingOut

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Mock supabase.auth.signOut to resolve after delay with { error: null }, spy on setIsLoggingOut calls
- Act: Call logout() function
- Assert: Verify setIsLoggingOut called with true immediately, then false after signOut resolves

**Oczekiwany rezultat:** Loading state true during operation, false after completion

**Priorytet:** Medium

**Edge cases:** Very slow network, timeout scenarios

**Notatki / uwagi:** Ensures loading state provides proper user feedback during logout

## UT-LOGOUT-006
**Nazwa testu:** should_use_stable_callback_reference_based_on_supabase_dependency

**Moduł / funkcja:** useCallback dependency management

**Cel testu:** Verify logout function reference stability based on supabase dependency

**Wejście / dane testowe:** Multiple hook renders with same/different supabase instances

**Setup / izolacja:** Mock useSupabaseAuth with different supabase instances

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Render hook twice with same supabase mock, then with different supabase mock
- Act: Compare logout function references between renders
- Assert: Verify logout function reference stable when supabase same, changes when supabase changes

**Oczekiwany rezultat:** Callback stable when dependency unchanged, new reference when dependency changes

**Priorytet:** Medium

**Edge cases:** Supabase client recreation, auth state changes

**Notatki / uwagi:** Tests React optimization with useCallback dependency array

## UT-LOGOUT-007
**Nazwa testu:** should_not_redirect_on_error_conditions

**Moduł / funkcja:** logout function - redirect logic

**Cel testu:** Verify redirect only happens on successful logout, not on errors

**Wejście / dane testowe:** Mock supabase.auth.signOut returns error

**Setup / izolacja:** Mock useSupabaseAuth, spy on window.location.assign

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Mock supabase.auth.signOut to return error, spy on window.location.assign
- Act: Call logout() function
- Assert: Verify window.location.assign never called, error returned instead

**Oczekiwany rezultat:** No redirect on logout failure

**Priorytet:** Medium

**Edge cases:** Network errors, auth service unavailable

**Notatki / uwagi:** Ensures user stays on current page when logout fails, allowing retry or error display

## UT-LOGOUT-008
**Nazwa testu:** should_handle_multiple_concurrent_logout_calls

**Moduł / funkcja:** logout function - concurrent operations

**Cel testu:** Verify behavior when logout is called multiple times concurrently

**Wejście / dane testowe:** Multiple simultaneous logout calls

**Setup / izolacja:** Mock useSupabaseAuth with async signOut, spy on setIsLoggingOut

**Kroki testowe (Arrange → Act → Assert):**
- Arrange: Mock slow supabase.auth.signOut, spy on setIsLoggingOut
- Act: Call logout() multiple times concurrently
- Assert: Verify loading state managed properly, multiple signOut calls handled gracefully

**Oczekiwany rezultat:** Each call manages its own loading state independently

**Priorytet:** Low

**Edge cases:** Race conditions between multiple logout attempts

**Notatki / uwagi:** Tests robustness against user clicking logout multiple times
