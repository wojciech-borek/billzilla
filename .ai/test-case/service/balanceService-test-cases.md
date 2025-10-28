# Test Case'y dla balanceService.ts

**Ścieżka pliku:** `src/lib/services/balanceService.ts`

## Test Case'y dla BalanceCalculationError

### UT-BALANCE-ERROR-001
**Nazwa testu:** `should_create_error_with_operation_and_details_when_both_provided`  
**Moduł / funkcja:** BalanceCalculationError.constructor  
**Cel testu:** Sprawdzenie tworzenia błędu z operacją i szczegółami  
**Wejście / dane testowe:**
- operation: "fetch user expenses"
- details: "Database connection failed"  
**Setup / izolacja:** Brak zależności zewnętrznych  
**Kroki testowe (Arrange → Act → Assert):**
1. Utworzyć instancję BalanceCalculationError z parametrami operation i details
2. Sprawdzić wiadomość błędu
3. Sprawdzić nazwę błędu  
**Oczekiwany rezultat:** Błąd z wiadomością "Balance calculation failed during fetch user expenses: Database connection failed" i nazwą "BalanceCalculationError"  
**Priorytet:** Wysoki  
**Edge cases:** Operation pusty string, details null/undefined  
**Notatki / uwagi:** Test konstruktora klasy błędu

### UT-BALANCE-ERROR-002
**Nazwa testu:** `should_create_error_with_only_operation_when_details_not_provided`  
**Moduł / funkcja:** BalanceCalculationError.constructor  
**Cel testu:** Sprawdzenie tworzenia błędu tylko z operacją  
**Wejście / dane testowe:**
- operation: "calculate balances"
- details: undefined  
**Setup / izolacja:** Brak zależności zewnętrznych  
**Kroki testowe (Arrange → Act → Assert):**
1. Utworzyć instancję BalanceCalculationError bez parametru details
2. Sprawdzić wiadomość błędu
3. Sprawdzić nazwę błędu  
**Oczekiwany rezultat:** Błąd z wiadomością "Balance calculation failed during calculate balances" i nazwą "BalanceCalculationError"  
**Priorytet:** Wysoki  
**Edge cases:** Operation null/undefined  
**Notatki / uwagi:** Test konstruktora bez opcjonalnego parametru

## Test Case'y dla calculateUserBalances - Walidacja wejścia

### UT-BALANCE-CALC-001
**Nazwa testu:** `should_throw_error_when_userId_is_empty`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie walidacji pustego userId  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: ""
- groupIds: ["group1", "group2"]  
**Setup / izolacja:** Mock SupabaseClient, nie wykonywać rzeczywistych zapytań  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mock SupabaseClient
2. Wywołać calculateUserBalances z pustym userId
3. Złapać rzucony błąd  
**Oczekiwany rezultat:** BalanceCalculationError z wiadomością zawierającą "User ID is required"  
**Priorytet:** Wysoki  
**Edge cases:** userId null, userId undefined  
**Notatki / uwagi:** Test walidacji wejścia

### UT-BALANCE-CALC-002
**Nazwa testu:** `should_throw_error_when_groupIds_is_empty_array`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie walidacji pustej tablicy groupIds  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: []  
**Setup / izolacja:** Mock SupabaseClient, nie wykonywać rzeczywistych zapytań  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mock SupabaseClient
2. Wywołać calculateUserBalances z pustą tablicą groupIds
3. Złapać rzucony błąd  
**Oczekiwany rezultat:** BalanceCalculationError z wiadomością zawierającą "At least one group ID is required"  
**Priorytet:** Wysoki  
**Edge cases:** groupIds null, groupIds undefined  
**Notatki / uwagi:** Test walidacji wejścia

### UT-BALANCE-CALC-003
**Nazwa testu:** `should_throw_error_when_groupIds_is_null`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie walidacji null groupIds  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: null  
**Setup / izolacja:** Mock SupabaseClient, nie wykonywać rzeczywistych zapytań  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mock SupabaseClient
2. Wywołać calculateUserBalances z groupIds = null
3. Złapać rzucony błąd  
**Oczekiwany rezultat:** BalanceCalculationError z wiadomością zawierającą "At least one group ID is required"  
**Priorytet:** Wysoki  
**Edge cases:** groupIds undefined  
**Notatki / uwagi:** Test walidacji wejścia

## Test Case'y dla calculateUserBalances - Pobieranie danych

### UT-BALANCE-CALC-004
**Nazwa testu:** `should_call_all_data_fetching_functions_with_correct_parameters`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie wywoływania wszystkich funkcji pobierania danych z właściwymi parametrami  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1", "group2"]  
**Setup / izolacja:** Mock wszystkich funkcji fetchUserExpenses, fetchUserExpenseSplits, fetchUserSettlements, fetchExchangeRates  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki dla wszystkich funkcji pobierania danych
2. Wywołać calculateUserBalances
3. Sprawdzić czy wszystkie funkcje zostały wywołane z właściwymi parametrami  
**Oczekiwany rezultat:** Wszystkie funkcje pobierania danych wywołane z parametrami (supabase, userId, groupIds)  
**Priorytet:** Wysoki  
**Edge cases:** Jeden z groupIds pusty string  
**Notatki / uwagi:** Test integracji funkcji pobierania danych

### UT-BALANCE-CALC-005
**Nazwa testu:** `should_rethrow_balance_calculation_error_from_fetch_functions`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie przekazywania błędów BalanceCalculationError z funkcji pobierania  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]  
**Setup / izolacja:** Mock fetchUserExpenses rzuca BalanceCalculationError  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mock fetchUserExpenses rzucający BalanceCalculationError
2. Wywołać calculateUserBalances
3. Złapać rzucony błąd  
**Oczekiwany rezultat:** Oryginalny BalanceCalculationError przekazany dalej bez zmian  
**Priorytet:** Wysoki  
**Edge cases:** Błąd z fetchUserExpenseSplits, fetchUserSettlements, fetchExchangeRates  
**Notatki / uwagi:** Test obsługi błędów

### UT-BALANCE-CALC-006
**Nazwa testu:** `should_wrap_unexpected_errors_in_balance_calculation_error`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie opakowywania nieoczekiwanych błędów  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]  
**Setup / izolacja:** Mock fetchUserExpenses rzuca zwykły Error  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mock fetchUserExpenses rzucający zwykły Error("Network error")
2. Wywołać calculateUserBalances
3. Złapać rzucony błąd  
**Oczekiwany rezultat:** BalanceCalculationError z wiadomością zawierającą "calculate balances: Network error"  
**Priorytet:** Średni  
**Edge cases:** Błąd inny niż Error (string, object)  
**Notatki / uwagi:** Test obsługi nieoczekiwanych błędów

## Test Case'y dla calculateUserBalances - Obliczenia bilansu

### UT-BALANCE-CALC-007
**Nazwa testu:** `should_return_zero_balances_for_all_groups_when_no_expenses_or_settlements`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie zwracania zerowych bilansów gdy brak danych  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1", "group2"]
- userExpenses: []
- userSplits: []
- settlements: []
- exchangeRates: Map z kursami 1.0 dla wszystkich walut  
**Setup / izolacja:** Mock wszystkich funkcji pobierania zwracających puste tablice  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki zwracające puste dane
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony Map  
**Oczekiwany rezultat:** Map z kluczami "group1" i "group2", obie wartości równe 0  
**Priorytet:** Wysoki  
**Edge cases:** Jeden z groupIds bez danych  
**Notatki / uwagi:** Test przypadku bazowego

### UT-BALANCE-CALC-008
**Nazwa testu:** `should_add_expenses_paid_by_user_to_balance`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie dodawania wydatków opłaconych przez użytkownika do bilansu  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]
- userExpenses: [{group_id: "group1", amount: 100, currency_code: "USD"}]
- userSplits: []
- settlements: []
- exchangeRates: Map z kursem USD = 1.0 dla group1  
**Setup / izolacja:** Mocki zwracające dane testowe  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki z expense opłaconym przez użytkownika
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans  
**Oczekiwany rezultat:** Map z kluczem "group1" i wartością 100  
**Priorytet:** Wysoki  
**Edge cases:** Wielokrotne expenses w tej samej grupie  
**Notatki / uwagi:** Test dodawania wydatków

### UT-BALANCE-CALC-009
**Nazwa testu:** `should_subtract_expense_splits_owed_by_user_from_balance`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie odejmowania udziałów w wydatkach od bilansu  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]
- userExpenses: []
- userSplits: [{amount: 50, expenses: {group_id: "group1", currency_code: "USD"}}]
- settlements: []
- exchangeRates: Map z kursem USD = 1.0 dla group1  
**Setup / izolacja:** Mocki zwracające dane testowe  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki z expense split dla użytkownika
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans  
**Oczekiwany rezultat:** Map z kluczem "group1" i wartością -50  
**Priorytet:** Wysoki  
**Edge cases:** Wielokrotne splits w tej samej grupie  
**Notatki / uwagi:** Test odejmowania udziałów

### UT-BALANCE-CALC-010
**Nazwa testu:** `should_add_settlements_received_by_user_to_balance`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie dodawania otrzymanych rozliczeń do bilansu  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]
- userExpenses: []
- userSplits: []
- settlements: [{group_id: "group1", amount: 25, payer_id: "user456", payee_id: "user123"}]
- exchangeRates: Map z kursem USD = 1.0 dla group1  
**Setup / izolacja:** Mocki zwracające dane testowe  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki z settlement gdzie użytkownik jest odbiorcą
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans  
**Oczekiwany rezultat:** Map z kluczem "group1" i wartością 25  
**Priorytet:** Wysoki  
**Edge cases:** Wielokrotne settlements received  
**Notatki / uwagi:** Test dodawania rozliczeń otrzymanych

### UT-BALANCE-CALC-011
**Nazwa testu:** `should_subtract_settlements_paid_by_user_from_balance`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie odejmowania zapłaconych rozliczeń od bilansu  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]
- userExpenses: []
- userSplits: []
- settlements: [{group_id: "group1", amount: 30, payer_id: "user123", payee_id: "user456"}]
- exchangeRates: Map z kursem USD = 1.0 dla group1  
**Setup / izolacja:** Mocki zwracające dane testowe  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki z settlement gdzie użytkownik jest płatnikiem
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans  
**Oczekiwany rezultat:** Map z kluczem "group1" i wartością -30  
**Priorytet:** Wysoki  
**Edge cases:** Wielokrotne settlements paid  
**Notatki / uwagi:** Test odejmowania rozliczeń zapłaconych

### UT-BALANCE-CALC-012
**Nazwa testu:** `should_apply_currency_conversion_when_calculating_balance`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie przeliczania walut przy obliczaniu bilansu  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]
- userExpenses: [{group_id: "group1", amount: 100, currency_code: "EUR"}]
- userSplits: []
- settlements: []
- exchangeRates: Map z kursem EUR = 1.2 dla group1 (1 EUR = 1.2 base currency)  
**Setup / izolacja:** Mocki zwracające dane testowe z różnymi walutami  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki z expense w EUR i kursem wymiany
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans  
**Oczekiwany rezultat:** Map z kluczem "group1" i wartością 120 (100 * 1.2)  
**Priorytet:** Wysoki  
**Edge cases:** Kurs wymiany równy 0, kurs wymiany ujemny  
**Notatki / uwagi:** Test konwersji walut

### UT-BALANCE-CALC-013
**Nazwa testu:** `should_use_default_exchange_rate_of_1_when_currency_not_found`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie domyślnego kursu wymiany gdy waluta nie znaleziona  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]
- userExpenses: [{group_id: "group1", amount: 100, currency_code: "XYZ"}]
- userSplits: []
- settlements: []
- exchangeRates: Map pusty dla group1  
**Setup / izolacja:** Mocki bez kursów wymiany dla waluty XYZ  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki z expense w nieznanej walucie
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans  
**Oczekiwany rezultat:** Map z kluczem "group1" i wartością 100 (100 * 1.0 domyślny kurs)  
**Priorytet:** Średni  
**Edge cases:** Brak kursów dla grupy  
**Notatki / uwagi:** Test domyślnego kursu wymiany

### UT-BALANCE-CALC-014
**Nazwa testu:** `should_calculate_complex_balance_with_all_components`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie złożonego obliczenia bilansu ze wszystkimi komponentami  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1"]
- userExpenses: [{group_id: "group1", amount: 200, currency_code: "USD"}]
- userSplits: [{amount: 50, expenses: {group_id: "group1", currency_code: "USD"}}]
- settlements: [
  {group_id: "group1", amount: 25, payer_id: "user456", payee_id: "user123"},
  {group_id: "group1", amount: 30, payer_id: "user123", payee_id: "user456"}
]
- exchangeRates: Map z kursem USD = 1.0 dla group1  
**Setup / izolacja:** Mocki ze wszystkimi typami danych  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki ze złożonymi danymi
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans  
**Oczekiwany rezultat:** Map z kluczem "group1" i wartością 145 (200 - 50 + 25 - 30)  
**Priorytet:** Wysoki  
**Edge cases:** Bilans końcowy ujemny, bilans końcowy równy zero  
**Notatki / uwagi:** Test pełnego scenariusza obliczeń bilansu

### UT-BALANCE-CALC-015
**Nazwa testu:** `should_handle_multiple_groups_with_different_currencies`  
**Moduł / funkcja:** calculateUserBalances  
**Cel testu:** Sprawdzenie obsługi wielu grup z różnymi walutami  
**Wejście / dane testowe:**
- supabase: mock SupabaseClient
- userId: "user123"
- groupIds: ["group1", "group2"]
- userExpenses: [
  {group_id: "group1", amount: 100, currency_code: "USD"},
  {group_id: "group2", amount: 50, currency_code: "EUR"}
]
- userSplits: []
- settlements: []
- exchangeRates: Map z kursami USD = 1.0 dla group1, EUR = 0.9 dla group2  
**Setup / izolacja:** Mocki z danymi dla wielu grup  
**Kroki testowe (Arrange → Act → Assert):**
1. Przygotować mocki z expenses w różnych grupach i walutach
2. Wywołać calculateUserBalances
3. Sprawdzić zwrócony bilans dla obu grup  
**Oczekiwany rezultat:** Map z kluczami "group1": 100, "group2": 45 (50 * 0.9)  
**Priorytet:** Wysoki  
**Edge cases:** Jedna grupa bez kursów wymiany  
**Notatki / uwagi:** Test obsługi wielu grup
