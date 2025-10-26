# Test Cases dla useExpenseForm Hook

## Inicjalizacja Hook'a

### UT-USEXPENSEFORM-INIT-001
**Nazwa testu**: `should_initialize_with_default_values_when_no_initial_data_provided`

**Moduł / funkcja**: `useExpenseForm` - inicjalizacja

**Cel testu**: Sprawdzenie czy hook inicjalizuje się z poprawnymi wartościami domyślnymi gdy nie podano danych początkowych

**Wejście / dane testowe**:
- `groupMembers`: `[{ profile_id: "user1", display_name: "User 1" }, { profile_id: "user2", display_name: "User 2" }]`
- `groupCurrencies`: `[{ code: "PLN", name: "Polski Złoty" }, { code: "EUR", name: "Euro" }]`
- `defaultPayerId`: `undefined`
- `initialData`: `undefined`

**Setup / izolacja**: Mockowanie `useForm`, `useState`, `useMemo`, `useCallback` z React Testing Library

**Kroki testowe (Arrange → Act → Assert)**:
1. Renderuj hook z podanymi parametrami
2. Sprawdź wartości domyślne formularza
3. Sprawdź stan początkowy hook'a

**Oczekiwany rezultat**:
- `form.getValues()` zwraca `{ description: undefined, amount: undefined, currency_code: "PLN", expense_date: <current_date>, payer_id: undefined, splits: [] }`
- `splitValidation` zwraca `{ totalAmount: 0, currentSum: 0, remaining: 0, isValid: true }`
- Stan: `{ isSubmitting: false, submitError: null, fieldErrors: null }`

**Priorytet**: Wysoki

**Edge cases**: Brak walut w grupie (powinien użyć "PLN" jako fallback)

**Notatki / uwagi**: Testuje ścieżkę szczęśliwą inicjalizacji bez danych początkowych

### UT-USEXPENSEFORM-INIT-002
**Nazwa testu**: `should_initialize_with_initial_data_when_provided`

**Moduł / funkcja**: `useExpenseForm` - inicjalizacja

**Cel testu**: Sprawdzenie czy hook używa podanych danych początkowych zamiast wartości domyślnych

**Wejście / dane testowe**:
- `groupMembers`: `[{ profile_id: "user1", display_name: "User 1" }]`
- `groupCurrencies`: `[{ code: "EUR", name: "Euro" }]`
- `defaultPayerId`: `"user1"`
- `initialData`: `{ description: "Lunch", amount: 50, currency_code: "EUR", expense_date: "2023-10-01T12:00", payer_id: "user1", splits: [{ profile_id: "user1", amount: 50 }] }`

**Setup / izolacja**: Mockowanie React hooks

**Kroki testowe (Arrange → Act → Assert)**:
1. Renderuj hook z danymi początkowymi
2. Sprawdź czy formularz używa wartości z `initialData`
3. Sprawdź czy splitValidation oblicza się poprawnie

**Oczekiwany rezultat**:
- Formularz zawiera wartości z `initialData`
- `splitValidation.isValid` jest `true` (suma podziałów równa kwocie całkowitej)

**Priorytet**: Wysoki

**Edge cases**: Niepoprawne dane początkowe (np. splits z ujemnymi kwotami)

**Notatki / uwagi**: Weryfikuje priorytet danych początkowych nad wartościami domyślnymi

### UT-USEEXPENSEFORM-INIT-003
**Nazwa testu**: `should_use_default_currency_when_no_currencies_available`

**Moduł / funkcja**: `useExpenseForm` - inicjalizacja

**Cel testu**: Sprawdzenie zachowania gdy lista walut grupy jest pusta

**Wejście / dane testowe**:
- `groupMembers`: `[{ profile_id: "user1" }]`
- `groupCurrencies`: `[]` (pusta tablica)
- `defaultPayerId`: `undefined`
- `initialData`: `undefined`

**Setup / izolacja**: Standardowe mockowanie

**Kroki testowe (Arrange → Act → Assert)**:
1. Renderuj hook z pustą listą walut
2. Sprawdź wartość domyślną `currency_code`

**Oczekiwany rezultat**:
- `form.getValues().currency_code` równa się `"PLN"` (hardkodowany fallback)

**Priorytet**: Średni

**Edge cases**: -

**Notatki / uwagi**: Testuje fallback dla pustej listy walut

## Walidacja Podziałów (Split Validation)

### UT-USEEXPENSEFORM-SPLIT-001
**Nazwa testu**: `should_calculate_valid_split_when_amounts_match_exactly`

**Moduł / funkcja**: `useExpenseForm.splitValidation`

**Cel testu**: Sprawdzenie czy walidacja podziałów poprawnie oblicza gdy suma podziałów równa się kwocie całkowitej

**Wejście / dane testowe**:
- Formularz: `amount: 100`, `splits: [{ profile_id: "user1", amount: 50 }, { profile_id: "user2", amount: 50 }]`

**Setup / izolacja**: Mockowanie `form.watch` aby zwracał testowe wartości

**Kroki testowe (Arrange → Act → Assert)**:
1. Ustaw wartości w formularzu
2. Wywołaj rerender hook'a aby przeliczyć `splitValidation`
3. Sprawdź wynik obliczeń

**Oczekiwany rezultat**:
- `splitValidation.totalAmount: 100`
- `splitValidation.currentSum: 100`
- `splitValidation.remaining: 0`
- `splitValidation.isValid: true`
- Brak błędu walidacji w `fieldErrors.splits`

**Priorytet**: Wysoki

**Edge cases**: Dokładne dopasowanie z tolerancją ±0.01

**Notatki / uwagi**: Testuje główną logikę walidacji podziałów

### UT-USEEXPENSEFORM-SPLIT-002
**Nazwa testu**: `should_mark_split_invalid_when_sum_exceeds_total`

**Moduł / funkcja**: `useExpenseForm.splitValidation`

**Cel testu**: Sprawdzenie czy walidacja wykrywa gdy suma podziałów przekracza kwotę całkowitą

**Wejście / dane testowe**:
- Formularz: `amount: 100`, `splits: [{ profile_id: "user1", amount: 60 }, { profile_id: "user2", amount: 50 }]`

**Setup / izolacja**: Mockowanie watchers formularza

**Kroki testowe (Arrange → Act → Assert)**:
1. Ustaw wartości formularza z nadwyżką
2. Sprawdź obliczenia `splitValidation`
3. Sprawdź czy ustawiony jest błąd walidacji

**Oczekiwany rezultat**:
- `splitValidation.remaining: -10`
- `splitValidation.isValid: false`
- `fieldErrors.splits` zawiera komunikat o niezgodności sum

**Priorytet**: Wysoki

**Edge cases**: Różnica mniejsza niż tolerancja (±0.01)

**Notatki / uwagi**: Testuje wykrywanie nadwyżki w podziałach

### UT-USEEXPENSEFORM-SPLIT-003
**Nazwa testu**: `should_handle_empty_splits_array`

**Moduł / funkcja**: `useExpenseForm.splitValidation`

**Cel testu**: Sprawdzenie zachowania gdy nie ma żadnych podziałów

**Wejście / dane testowe**:
- Formularz: `amount: 100`, `splits: []`

**Setup / izolacja**: Standardowe mockowanie

**Kroki testowe (Arrange → Act → Assert)**:
1. Ustaw kwotę bez podziałów
2. Sprawdź wynik walidacji

**Oczekiwany rezultat**:
- `splitValidation.currentSum: 0`
- `splitValidation.remaining: 100`
- `splitValidation.isValid: false`
- Brak błędu `fieldErrors.splits` (ponieważ `watchedSplitsArray.length === 0`)

**Priorytet**: Średni

**Edge cases**: -

**Notatki / uwagi**: Testuje przypadek braku podziałów

## Wysyłanie Formularza (handleSubmit)

### UT-USEEXPENSEFORM-SUBMIT-001
**Nazwa testu**: `should_submit_successfully_with_valid_data`

**Moduł / funkcja**: `useExpenseForm.handleSubmit`

**Cel testu**: Sprawdzenie pomyślnego wysłania formularza z poprawnymi danymi

**Wejście / dane testowe**:
- Formularz: pełne poprawne dane
- `groupId`: `"group123"`
- Mock API zwraca sukces z `ExpenseDTO`

**Setup / izolacja**: Mockowanie `fetch`, `form.trigger`, `form.getValues`

**Kroki testowe (Arrange → Act → Assert)**:
1. Przygotuj poprawne dane formularza
2. Mockuj API aby zwracało sukces
3. Wywołaj `handleSubmit("group123")`
4. Sprawdź rezultat

**Oczekiwany rezultat**:
- Funkcja zwraca `ExpenseDTO`
- Stan: `isSubmitting: false`, `submitError: null`, `fieldErrors: null`
- API zostało wywołane z poprawnym `CreateExpenseCommand`

**Priorytet**: Wysoki

**Edge cases**: -

**Notatki / uwagi**: Testuje główną ścieżkę sukcesu

### UT-USEEXPENSEFORM-SUBMIT-002
**Nazwa testu**: `should_fail_validation_when_description_missing`

**Moduł / funkcja**: `useExpenseForm.handleSubmit`

**Cel testu**: Sprawdzenie walidacji gdy brakuje opisu wydatku

**Wejście / dane testowe**:
- Formularz: `description: ""` lub `undefined`

**Setup / izolacja**: Mockowanie formularza i API

**Kroki testowe (Arrange → Act → Assert)**:
1. Ustaw pusty opis w formularzu
2. Wywołaj `handleSubmit`
3. Sprawdź obsługę błędu

**Oczekiwany rezultat**:
- Rzucany jest błąd z komunikatem "Description is required"
- Stan zawiera `fieldErrors: { description: "Opis wydatku jest wymagany" }`
- `isSubmitting: false`

**Priorytet**: Wysoki

**Edge cases**: Opis zawierający tylko białe znaki

**Notatki / uwagi**: Testuje walidację wymaganego pola description

### UT-USEEXPENSEFORM-SUBMIT-003
**Nazwa testu**: `should_fail_validation_when_amount_invalid`

**Moduł / funkcja**: `useExpenseForm.handleSubmit`

**Cel testu**: Sprawdzenie walidacji nieprawidłowej kwoty

**Wejście / dane testowe**:
- Formularz: `amount: 0` lub `amount: -10`

**Setup / izolacja**: Mockowanie formularza

**Kroki testowe (Arrange → Act → Assert)**:
1. Ustaw nieprawidłową kwotę
2. Wywołaj `handleSubmit`
3. Sprawdź błąd walidacji

**Oczekiwany rezultat**:
- Błąd: "Amount is required"
- `fieldErrors.amount: "Kwota musi być większa od zera"`

**Priorytet**: Wysoki

**Edge cases**: Ułamkowe wartości graniczne

**Notatki / uwagi**: Testuje walidację pola amount

### UT-USEEXPENSEFORM-SUBMIT-004
**Nazwa testu**: `should_handle_api_error_400_with_field_errors`

**Moduł / funkcja**: `useExpenseForm.handleSubmit`

**Cel testu**: Sprawdzenie obsługi błędów walidacji z API (status 400)

**Wejście / dane testowe**:
- API zwraca status 400 z `error.details` zawierającym błędy pól

**Setup / izolacja**: Mockowanie `fetch` aby zwracał błąd 400

**Kroki testowe (Arrange → Act → Assert)**:
1. Przygotuj dane formularza
2. Mockuj API błąd 400 z `error.details`
3. Wywołaj `handleSubmit`
4. Sprawdź obsługę błędu

**Oczekiwany rezultat**:
- Stan zawiera `fieldErrors` z API
- `isSubmitting: false`
- Rzucany jest błąd z komunikatem z API

**Priorytet**: Wysoki

**Edge cases**: -

**Notatki / uwagi**: Testuje integrację z API błędami walidacji

### UT-USEEXPENSEFORM-SUBMIT-005
**Nazwa testu**: `should_handle_api_error_401_unauthorized`

**Moduł / funkcja**: `useExpenseForm.handleSubmit`

**Cel testu**: Sprawdzenie obsługi błędu autoryzacji

**Wejście / dane testowe**:
- API zwraca status 401

**Setup / izolacja**: Mock `fetch` z statusem 401

**Kroki testowe (Arrange → Act → Assert)**:
1. Wywołaj `handleSubmit`
2. Sprawdź komunikat błędu dla statusu 401

**Oczekiwany rezultat**:
- `submitError: "Brak autoryzacji. Zaloguj się ponownie."`

**Priorytet**: Średni

**Edge cases**: -

**Notatki / uwagi**: Testuje obsługę różnych statusów HTTP

### UT-USEEXPENSEFORM-SUBMIT-006
**Nazwa testu**: `should_filter_zero_amount_splits_before_submission`

**Moduł / funkcja**: `useExpenseForm.handleSubmit`

**Cel testu**: Sprawdzenie czy podziały z kwotą 0 są filtrowane przed wysłaniem

**Wejście / dane testowe**:
- Formularz zawiera splits z `amount: 0` i `amount > 0`

**Setup / izolacja**: Mockowanie formularza z mieszanymi splits

**Kroki testowe (Arrange → Act → Assert)**:
1. Ustaw splits zawierające wartości zerowe
2. Wywołaj `handleSubmit`
3. Sprawdź czy API otrzymuje tylko splits z `amount > 0`

**Oczekiwany rezultat**:
- `CreateExpenseCommand.splits` zawiera tylko pozycje z `amount > 0`

**Priorytet**: Średni

**Edge cases**: Wszystkie splits mają amount = 0

**Notatki / uwagi**: Testuje filtrowanie splits przed wysłaniem do API

## Wypełnianie z Transkrypcji (populateFromTranscription)

### UT-USEEXPENSEFORM-TRANSCRIPT-001
**Nazwa testu**: `should_populate_form_with_valid_transcription_data`

**Moduł / funkcja**: `useExpenseForm.populateFromTranscription`

**Cel testu**: Sprawdzenie poprawnego wypełnienia formularza danymi z transkrypcji

**Wejście / dane testowe**:
- `ExpenseTranscriptionResult`: pełne poprawne dane
- Członkowie grupy i waluty dostępne

**Setup / izolacja**: Mockowanie formularza i parametrów hook'a

**Kroki testowe (Arrange → Act → Assert)**:
1. Przygotuj poprawne dane transkrypcji
2. Wywołaj `populateFromTranscription(data)`
3. Sprawdź czy formularz został wypełniony

**Oczekiwany rezultat**:
- Wszystkie pola formularza zawierają dane z transkrypcji
- Stan błędu wyczyszczony
- Wywołana walidacja formularza

**Priorytet**: Wysoki

**Edge cases**: -

**Notatki / uwagi**: Testuje główną funkcjonalność wypełniania z transkrypcji

### UT-USEEXPENSEFORM-TRANSCRIPT-002
**Nazwa testu**: `should_apply_defaults_for_missing_optional_fields`

**Moduł / funkcja**: `useExpenseForm.populateFromTranscription`

**Cel testu**: Sprawdzenie stosowania wartości domyślnych dla pól opcjonalnych

**Wejście / dane testowe**:
- `ExpenseTranscriptionResult`: brak `currency_code`, `expense_date`, `payer_id`

**Setup / izolacja**: Mockowanie parametrów hook'a z wartościami domyślnymi

**Kroki testowe (Arrange → Act → Assert)**:
1. Przygotuj dane transkrypcji bez pól opcjonalnych
2. Wywołaj `populateFromTranscription`
3. Sprawdź zastosowanie wartości domyślnych

**Oczekiwany rezultat**:
- `currency_code`: używa pierwszej waluty grupy lub "PLN"
- `expense_date`: aktualna data/czas
- `payer_id`: używa `defaultPayerId` lub pierwszego członka grupy

**Priorytet**: Wysoki

**Edge cases**: Brak dostępnych walut grupy

**Notatki / uwagi**: Testuje logikę domyślnych wartości

### UT-USEEXPENSEFORM-TRANSCRIPT-003
**Nazwa testu**: `should_validate_required_fields_and_throw_on_missing_description`

**Moduł / funkcja**: `useExpenseForm.populateFromTranscription`

**Cel testu**: Sprawdzenie walidacji wymaganych pól w danych transkrypcji

**Wejście / dane testowe**:
- `ExpenseTranscriptionResult`: `description: ""`

**Setup / izolacja**: Standardowe mockowanie

**Kroki testowe (Arrange → Act → Assert)**:
1. Przygotuj dane z pustym opisem
2. Wywołaj `populateFromTranscription`
3. Sprawdź rzucenie błędu

**Oczekiwany rezultat**:
- Rzucany błąd: "Brak opisu w danych z transkrypcji"
- Formularz nie zostaje wypełniony

**Priorytet**: Wysoki

**Edge cases**: Opis zawierający tylko białe znaki

**Notatki / uwagi**: Testuje walidację wymaganego pola description w transkrypcji

### UT-USEEXPENSEFORM-TRANSCRIPT-004
**Nazwa testu**: `should_filter_invalid_participants_from_splits`

**Moduł / funkcja**: `useExpenseForm.populateFromTranscription`

**Cel testu**: Sprawdzenie filtrowania uczestników podziału którzy nie należą do grupy

**Wejście / dane testowe**:
- `ExpenseTranscriptionResult.splits`: zawiera profile_id nienależące do grupy

**Setup / izolacja**: Mockowanie `groupMembers` bez niektórych uczestników

**Kroki testowe (Arrange → Act → Assert)**:
1. Przygotuj splits z nieprawidłowymi uczestnikami
2. Wywołaj `populateFromTranscription`
3. Sprawdź filtrowanie nieprawidłowych splits

**Oczekiwany rezultat**:
- Tylko splits z uczestnikami należącymi do grupy zostają ustawione w formularzu
- Logowane są ostrzeżenia dla odfiltrowanych uczestników

**Priorytet**: Wysoki

**Edge cases**: Wszystkie splits zawierają nieprawidłowych uczestników

**Notatki / uwagi**: Testuje walidację przynależności do grupy

### UT-USEEXPENSEFORM-TRANSCRIPT-005
**Nazwa testu**: `should_warn_when_payer_not_in_group`

**Moduł / funkcja**: `useExpenseForm.populateFromTranscription`

**Cel testu**: Sprawdzenie obsługi przypadku gdy płatnik nie należy do grupy

**Wejście / dane testowe**:
- `ExpenseTranscriptionResult.payer_id`: nie należy do grupy

**Setup / izolacja**: Mockowanie grupy bez wskazanego płatnika

**Kroki testowe (Arrange → Act → Assert)**:
1. Ustaw payer_id spoza grupy
2. Wywołaj `populateFromTranscription`
3. Sprawdź logowanie ostrzeżenia

**Oczekiwany rezultat**:
- Logowane ostrzeżenie "Payer not found in group"
- Funkcja nie rzuca błędu (używa pierwszego członka jako fallback)

**Priorytet**: Średni

**Edge cases**: -

**Notatki / uwagi**: Testuje graceful handling nieprawidłowego payer_id

## Reset Formularza

### UT-USEEXPENSEFORM-RESET-001
**Nazwa testu**: `should_reset_form_and_clear_all_state`

**Moduł / funkcja**: `useExpenseForm.reset`

**Cel testu**: Sprawdzenie całkowitego resetowania formularza i stanu

**Wejście / dane testowe**:
- Formularz z danymi i błędami

**Setup / izolacja**: Mockowanie formularza z istniejącymi danymi

**Kroki testowe (Arrange → Act → Assert)**:
1. Wypełnij formularz danymi i ustaw błędy
2. Wywołaj `reset()`
3. Sprawdź czy wszystko zostało wyczyszczone

**Oczekiwany rezultat**:
- `form.reset()` zostało wywołane
- Stan: `isSubmitting: false`, `submitError: null`, `fieldErrors: null`

**Priorytet**: Średni

**Edge cases**: -

**Notatki / uwagi**: Testuje kompletną funkcjonalność resetowania

---

**Podsumowanie**: Najważniejszymi modułami do pokrycia testami jednostkowymi są `handleSubmit` (obsługa błędów i walidacja), `populateFromTranscription` (walidacja danych z AI) oraz `splitValidation` (logika biznesowa podziałów). Te moduły zawierają najbardziej złożoną logikę i obsługują krytyczne scenariusze błędów.
