# Unit Test Cases for authService.ts

## SignupError Class

### UT-authService-01
**Nazwa testu**: should_create_error_with_message_and_original_error_when_constructed

**Moduł / funkcja**: SignupError.constructor

**Cel testu**: Weryfikacja, że SignupError prawidłowo ustawia wiadomość i oryginalny błąd

**Wejście / dane testowe**:
- message: "Test error message"
- originalError: new Error("Original error")

**Setup / izolacja**: Nie wymagane (czysty test konstruktora)

**Kroki testowe**:
1. Arrange: Create error instance with message and originalError
2. Act: Instantiate SignupError
3. Assert: Check message, name, and originalError properties

**Oczekiwany rezultat**: Error instance with correct message ("Test error message"), name ("SignupError"), and originalError reference

**Priorytet**: Wysoki

**Edge cases**:
- null originalError
- empty string message
- undefined originalError

**Notatki / uwagi**: Constructor is synchronous, no mocking needed

### UT-authService-02
**Nazwa testu**: should_create_error_with_only_message_when_no_original_error

**Moduł / funkcja**: SignupError.constructor

**Cel testu**: Weryfikacja, że SignupError działa tylko z parametrem message

**Wejście / dane testowe**:
- message: "Simple error message"
- originalError: undefined

**Setup / izolacja**: None required

**Kroki testowe**:
1. Arrange: Create error instance with only message
2. Act: Instantiate SignupError
3. Assert: Check message and name properties

**Oczekiwany rezultat**: Error instance with correct message and name, originalError undefined

**Priorytet**: Wysoki

**Edge cases**:
- Empty string message
- Very long message
- Message with special characters

**Notatki / uwagi**: Test covers default parameter behavior

## signupUser Function

### UT-authService-03
**Nazwa testu**: should_signup_successfully_when_supabase_signup_succeeds

**Moduł / funkcja**: signupUser

**Cel testu**: Weryfikacja poprawnego przepływu rejestracji użytkownika

**Wejście / dane testowe**:
- userData: { email: "test@example.com", password: "password123", full_name: "John Doe" }
- supabase mock: returns { error: null }

**Setup / izolacja**: Mock Supabase client signUp method to return success

**Kroki testowe**:
1. Arrange: Create mock supabase client and valid userData
2. Act: Call signupUser with mock client and userData
3. Assert: Function completes without throwing, signUp called with correct parameters

**Oczekiwany rezultat**: Function resolves without error, signUp called once with email, password, and user metadata

**Priorytet**: Wysoki

**Edge cases**:
- Email with uppercase letters
- Password with special characters
- Full name with unicode characters

**Notatki / uwagi**: Test ścieżki sukcesu, weryfikacja poprawnego mapowania danych do API Supabase

### UT-authService-04
**Nazwa testu**: should_throw_signup_error_when_supabase_returns_error

**Moduł / funkcja**: signupUser

**Cel testu**: Weryfikacja obsługi błędów gdy signUp Supabase kończy się niepowodzeniem

**Wejście / dane testowe**:
- userData: { email: "test@example.com", password: "password123", full_name: "John Doe" }
- supabase mock: returns { error: { message: "User already registered" } }

**Setup / izolacja**: Mock Supabase client signUp method to return error

**Kroki testowe**:
1. Arrange: Create mock supabase client that throws error and valid userData
2. Act: Call signupUser and catch exception
3. Assert: Custom SignupError thrown with correct message and original error

**Oczekiwany rezultat**: SignupError thrown with message "Rejestracja nie powiodła się: User already registered" and original error reference

**Priorytet**: Wysoki

**Edge cases**:
- Different error messages from Supabase
- Error object with additional properties
- null error message

**Notatki / uwagi**: Weryfikacja polskiego prefiksu komunikatu błędu i łączenia błędów

### UT-authService-05
**Nazwa testu**: should_throw_signup_error_when_unexpected_error_occurs

**Moduł / funkcja**: signupUser

**Cel testu**: Weryfikacja kompleksowej obsługi błędów dla nieoczekiwanych wyjątków

**Wejście / dane testowe**:
- userData: { email: "test@example.com", password: "password123", full_name: "John Doe" }
- supabase mock: throws generic Error

**Setup / izolacja**: Mock Supabase client signUp method to throw non-Supabase error

**Kroki testowe**:
1. Arrange: Create mock supabase client that throws unexpected error and valid userData
2. Act: Call signupUser and catch exception
3. Assert: Custom SignupError thrown with generic message

**Oczekiwany rezultat**: SignupError thrown with message "Wystąpił nieoczekiwany błąd podczas rejestracji" and original error reference

**Priorytet**: Średni

**Edge cases**:
- Network errors
- Permission errors
- Memory errors

**Notatki / uwagi**: Testuje blok catch-all dla błędów nieopakowanych jeszcze w SignupError

### UT-authService-06
**Nazwa testu**: should_pass_user_metadata_correctly_to_supabase

**Moduł / funkcja**: signupUser

**Cel testu**: Weryfikacja, że metadane użytkownika są prawidłowo przekazane do opcji signUp Supabase

**Wejście / dane testowe**:
- userData: { email: "test@example.com", password: "password123", full_name: "Test User" }
- supabase mock: returns { error: null }

**Setup / izolacja**: Mock Supabase client signUp method

**Kroki testowe**:
1. Arrange: Create mock supabase client and userData with full_name
2. Act: Call signupUser
3. Assert: signUp called with options.data containing full_name

**Oczekiwany rezultat**: signUp called with options.data.full_name equal to userData.full_name

**Priorytet**: Średni

**Edge cases**:
- Empty full_name
- Very long full_name
- full_name with special characters

**Notatki / uwagi**: Weryfikuje transformację danych z formularza do formatu API Supabase

### UT-authService-07
**Nazwa testu**: should_rethrow_existing_signup_error_without_wrapping

**Moduł / funkcja**: signupUser

**Cel testu**: Weryfikacja, że już opakowane SignupErrors są ponownie rzucone bez zmian

**Wejście / dane testowe**:
- userData: { email: "test@example.com", password: "password123", full_name: "John Doe" }
- supabase mock: throws SignupError

**Setup / izolacja**: Mock Supabase client to throw existing SignupError

**Kroki testowe**:
1. Arrange: Create mock that throws SignupError instance
2. Act: Call signupUser and catch exception
3. Assert: Same SignupError instance re-thrown, not wrapped again

**Oczekiwany rezultat**: Original SignupError instance thrown without additional wrapping

**Priorytet**: Średni

**Edge cases**:
- SignupError with different messages
- SignupError with/without originalError

**Notatki / uwagi**: Testuje sprawdzenie instanceof błędu w bloku catch

## Summary

Najważniejsze moduły do pokrycia unit testami to funkcja `signupUser` (wysoki priorytet - 4 testy) oraz klasa `SignupError` (średni priorytet - 2 testy). Funkcja `signupUser` wymaga kompleksowego pokrycia ze względu na interakcje z zewnętrznym API Supabase i obsługę błędów.
