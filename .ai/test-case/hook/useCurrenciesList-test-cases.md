# Test Cases for useCurrenciesList Hook

## UT-USECURRENCIESLIST-001

**Nazwa testu:** should_return_initial_loading_state_when_hook_mounts  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja stanu początkowego z loading true i pustą tablicą currencies  
**Wejście / dane testowe:** No input data required  
**Setup / izolacja:** Render hook in test environment, mock Supabase client  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Import and render useCurrenciesList hook
2. Act: Access initial return values immediately after render
3. Assert: Check loading is true, currencies is empty array, error is null  
   **Oczekiwany rezultat:** loading: true, currencies: [], error: null  
   **Priorytet:** High  
   **Edge cases:** None  
   **Notatki / uwagi:** Podstawowy test inicjalizacji stanu

## UT-USECURRENCIESLIST-002

**Nazwa testu:** should_fetch_and_transform_currencies_successfully  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja pomyślnego pobierania walut i transformacji danych  
**Wejście / dane testowe:** Mock Supabase data: [{code: "USD", name: "US Dollar"}, {code: "EUR", name: "Euro"}]  
**Setup / izolacja:** Mock Supabase client with successful response  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase from() method to return test currencies
2. Act: Render hook and wait for useEffect to complete
3. Assert: Check currencies array contains transformed objects with code and label  
   **Oczekiwany rezultat:** currencies: [{code: "USD", label: "USD — US Dollar"}, {code: "EUR", label: "EUR — Euro"}], loading: false, error: null  
   **Priorytet:** High  
   **Edge cases:** Empty response from database  
   **Notatki / uwagi:** Testuje logikę transformacji danych

## UT-USECURRENCIESLIST-003

**Nazwa testu:** should_sort_pln_first_then_alphabetically  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja, że waluta PLN pojawia się pierwsza, pozostałe posortowane alfabetycznie  
**Wejście / dane testowe:** Mock data: [{code: "USD", name: "US Dollar"}, {code: "PLN", name: "Polish Zloty"}, {code: "EUR", name: "Euro"}, {code: "GBP", name: "British Pound"}]  
**Setup / izolacja:** Mock Supabase client with mixed currency order  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase to return currencies in random order
2. Act: Render hook and wait for data processing
3. Assert: Check PLN is first, remaining currencies are alphabetically sorted  
   **Oczekiwany rezultat:** currencies[0].code === "PLN", subsequent codes in alphabetical order (EUR, GBP, USD)  
   **Priorytet:** High  
   **Edge cases:** Only PLN currency, no PLN currency  
   **Notatki / uwagi:** Testuje niestandardową logikę sortowania z priorytetem PLN

## UT-USECURRENCIESLIST-004

**Nazwa testu:** should_handle_fetch_error_gracefully  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja obsługi błędów gdy zapytanie Supabase kończy się niepowodzeniem  
**Wejście / dane testowe:** Mock Supabase error: "Database connection failed"  
**Setup / izolacja:** Mock Supabase client to throw error on select()  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase from() method to return error object
2. Act: Render hook and wait for error handling
3. Assert: Check error state contains error message, loading is false  
   **Oczekiwany rezultat:** error.message === "Database connection failed", loading: false, currencies: []  
   **Priorytet:** High  
   **Edge cases:** Network timeout, authentication errors  
   **Notatki / uwagi:** Testuje zarządzanie stanem błędu

## UT-USECURRENCIESLIST-005

**Nazwa testu:** should_prevent_state_updates_after_unmount  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja, że cleanup zapobiega wyciekom pamięci gdy komponent zostaje odmontowany  
**Wejście / dane testowe:** Mock async Supabase response  
**Setup / izolacja:** Mock Supabase with delayed response, unmount hook before response  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase with setTimeout before resolving
2. Act: Render hook, immediately unmount, wait for delayed response
3. Assert: Check no state updates occur after unmount (no console errors or warnings)  
   **Oczekiwany rezultat:** No state mutations after unmount, no memory leaks  
   **Priorytet:** Medium  
   **Edge cases:** Very slow network responses  
   **Notatki / uwagi:** Testuje funkcję cleanup w useEffect

## UT-USECURRENCIESLIST-006

**Nazwa testu:** should_handle_empty_currencies_response  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja zachowania gdy baza danych zwraca pustą tabelę walut  
**Wejście / dane testowe:** Mock Supabase data: [] (empty array)  
**Setup / izolacja:** Mock Supabase client returning empty data array  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase select() to return empty array
2. Act: Render hook and wait for data processing
3. Assert: Check currencies is empty array, loading false, error null  
   **Oczekiwany rezultat:** currencies: [], loading: false, error: null  
   **Priorytet:** Medium  
   **Edge cases:** None  
   **Notatki / uwagi:** Testuje przypadek brzegowy pustej tabeli bazy danych

## UT-USECURRENCIESLIST-007

**Nazwa testu:** should_transform_unknown_error_to_generic_message  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja, że obiekty niebędące Error są konwertowane na generyczną wiadomość błędu  
**Wejście / dane testowe:** Mock Supabase throwing string "Network error"  
**Setup / izolacja:** Mock Supabase to throw non-Error object  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase select() to throw string instead of Error
2. Act: Render hook and wait for error handling
3. Assert: Check error message is generic fallback  
   **Oczekiwany rezultat:** error.message === "Failed to fetch currencies", loading: false  
   **Priorytet:** Low  
   **Edge cases:** Throwing null, undefined, or objects  
   **Notatki / uwagi:** Testuje logikę konwersji typu błędu

## UT-USECURRENCIESLIST-008

**Nazwa testu:** should_maintain_loading_state_during_fetch  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja zarządzania stanem ładowania podczas operacji asynchronicznej  
**Wejście / dane testowe:** Mock delayed Supabase response  
**Setup / izolacja:** Mock Supabase with artificial delay  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase with setTimeout before resolving
2. Act: Render hook, check loading during delay, wait for completion
3. Assert: Check loading transitions from true to false  
   **Oczekiwany rezultat:** loading: true (during fetch), loading: false (after completion)  
   **Priorytet:** Medium  
   **Edge cases:** Very fast responses, very slow responses  
   **Notatki / uwagi:** Testuje przejścia stanu ładowania

## UT-USECURRENCIESLIST-009

**Nazwa testu:** should_call_supabase_with_correct_parameters  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja, że zapytanie Supabase jest wywoływane z prawidłową tabelą i sortowaniem  
**Wejście / dane testowe:** No specific data needed  
**Setup / izolacja:** Spy on Supabase client methods  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Spy on supabase.from() and select() methods
2. Act: Render hook and wait for fetch to complete
3. Assert: Check from() called with "currencies", select() with "code, name", order() with "code" ascending  
   **Oczekiwany rezultat:** Supabase methods called with correct parameters  
   **Priorytet:** Low  
   **Edge cases:** None  
   **Notatki / uwagi:** Testuje integrację z klientem Supabase

## UT-USECURRENCIESLIST-010

**Nazwa testu:** should_reset_error_state_on_retry_after_failure  
**Moduł / funkcja:** useCurrenciesList hook  
**Cel testu:** Weryfikacja, że stan błędu jest czyszczony gdy pobieranie powiedzie się po poprzednim błędzie  
**Wejście / dane testowe:** Mock failure then success responses  
**Setup / izolacja:** Mock Supabase to fail first, succeed on re-render  
**Kroki testowe (Arrange → Act → Assert):**

1. Arrange: Mock Supabase to throw error on first call, succeed on second
2. Act: Render hook (fails), re-render hook (succeeds)
3. Assert: Check error cleared after successful retry  
   **Oczekiwany rezultat:** error: null after successful fetch  
   **Priorytet:** Low  
   **Edge cases:** Multiple consecutive failures  
   **Notatki / uwagi:** Testuje logikę resetowania stanu błędu
