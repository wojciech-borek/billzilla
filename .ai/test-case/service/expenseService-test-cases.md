# Expense Service Unit Test Cases

## Module: createExpense

### UT-EXPENSE-001
**Nazwa testu:** `should_create_expense_successfully_when_all_validations_pass`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja poprawnego tworzenia wydatku gdy wszystkie walidacje przechodzą pomyślnie

**Wejście / dane testowe:**
- `groupId`: "group-123"
- `userId`: "user-456"
- `command`: {
  description: "Lunch at restaurant",
  amount: 50.00,
  currency_code: "USD",
  expense_date: "2024-01-15",
  payer_id: "user-456",
  splits: [
    { profile_id: "user-456", amount: 25.00 },
    { profile_id: "user-789", amount: 25.00 }
  ]
}

**Setup / izolacja:**
- Mock Supabase client z następującymi wywołaniami:
  - `groups.select().eq().eq().eq().single()` - zwraca grupę z użytkownikiem jako aktywnym członkiem
  - `group_members.select().eq().eq()` - zwraca listę aktywnych członków
  - `expenses.insert().select().single()` - zwraca utworzony wydatek
  - `expense_splits.insert()` - sukces
  - `expenses.select().eq().single()` - zwraca kompletny wydatek z danymi

**Kroki testowe:**
1. Arrange: Przygotuj mocki Supabase i dane testowe
2. Act: Wywołaj `createExpense` z parametrami
3. Assert: Sprawdź czy zwrócony ExpenseDTO zawiera poprawne dane

**Oczekiwany rezultat:** Funkcja zwraca ExpenseDTO z id, group_id, payer_id, description, amount, currency_code, expense_date, created_at, amount_in_base_currency, created_by, i splits

**Priorytet:** wysoki

**Edge cases:**
- Wydatek z jednym uczestnikiem podziału
- Wydatek z wieloma uczestnikami podziału (5+ osób)
- Kwota z większą precyzją dziesiętną (50.123456)

**Notatki / uwagi:** Test wymaga dokładnego mockowania wszystkich zapytań Supabase w odpowiedniej kolejności

---

### UT-EXPENSE-002
**Nazwa testu:** `should_throw_ExpenseNotFoundError_when_group_not_found`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja błędu gdy grupa nie istnieje lub użytkownik nie jest członkiem

**Wejście / dane testowe:**
- `groupId`: "nonexistent-group"
- `userId`: "user-456"
- `command`: prawidłowy CreateExpenseCommand

**Setup / izolacja:**
- Mock `groups.select().eq().eq().eq().single()` zwraca null/error

**Kroki testowe:**
1. Arrange: Przygotuj mock Supabase zwracający błąd dla zapytania o grupę
2. Act: Wywołaj `createExpense`
3. Assert: Sprawdź czy rzucony zostaje ExpenseNotFoundError z odpowiednią wiadomością

**Oczekiwany rezultat:** Rzucany jest ExpenseNotFoundError z wiadomością "Grupa nie została znaleziona lub użytkownik nie jest aktywnym członkiem"

**Priorytet:** wysoki

**Edge cases:**
- Grupa istnieje ale użytkownik nie jest członkiem
- Grupa istnieje ale użytkownik ma status "inactive"

**Notatki / uwagi:** Test pokrywa zarówno brak grupy jak i brak członkostwa użytkownika

---

### UT-EXPENSE-003
**Nazwa testu:** `should_throw_ExpenseValidationError_when_payer_not_active_member`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja błędu gdy płatnik nie jest aktywnym członkiem grupy

**Wejście / dane testowe:**
- `groupId`: "group-123"
- `userId`: "user-456" (aktywny członek)
- `command`: {
  payer_id: "inactive-user-999",
  splits: [{ profile_id: "user-456", amount: 50.00 }]
}

**Setup / izolacja:**
- Mock grupy i członków - payer_id nie znajduje się na liście aktywnych członków

**Kroki testowe:**
1. Arrange: Mock z prawidłową grupą ale payer_id spoza listy aktywnych członków
2. Act: Wywołaj `createExpense`
3. Assert: Sprawdź ExpenseValidationError z wiadomością "Płatnik musi być aktywnym członkiem grupy"

**Oczekiwany rezultat:** Rzucany jest ExpenseValidationError z prawidłową wiadomością

**Priorytet:** wysoki

**Edge cases:**
- Payer jest członkiem ale ma status "pending"
- Payer był członkiem ale został usunięty

**Notatki / uwagi:** Walidacja płatnika jest niezależna od twórcy wydatku

---

### UT-EXPENSE-004
**Nazwa testu:** `should_throw_ExpenseValidationError_when_split_participant_not_active_member`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja błędu gdy uczestnik podziału nie jest aktywnym członkiem grupy

**Wejście / dane testowe:**
- `groupId`: "group-123"
- `userId`: "user-456"
- `command`: {
  payer_id: "user-456",
  splits: [
    { profile_id: "user-456", amount: 25.00 },
    { profile_id: "inactive-user-999", amount: 25.00 }
  ]
}

**Setup / izolacja:**
- Mock z jednym z profile_id w splits spoza listy aktywnych członków

**Kroki testowe:**
1. Arrange: Przygotuj dane gdzie jeden uczestnik podziału nie jest aktywnym członkiem
2. Act: Wywołaj `createExpense`
3. Assert: Sprawdź ExpenseValidationError z wiadomością zawierającą ID nieprawidłowego uczestnika

**Oczekiwany rezultat:** Rzucany jest ExpenseValidationError z wiadomością "Split participant {profile_id} is not an active member of the group"

**Priorytet:** wysoki

**Edge cases:**
- Wielu nieprawidłowych uczestników w tym samym podziale
- Uczestnik ma status "invited" zamiast "active"

**Notatki / uwagi:** Test sprawdza walidację wszystkich uczestników podziału

---

### UT-EXPENSE-005
**Nazwa testu:** `should_throw_ExpenseValidationError_when_currency_not_configured`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja błędu gdy waluta nie jest skonfigurowana dla grupy

**Wejście / dane testowe:**
- `groupId`: "group-123"
- `command`: { currency_code: "XYZ" } (waluta nieobsługiwana przez grupę)

**Setup / izolacja:**
- Mock grupy zwraca group_currencies bez waluty "XYZ"

**Kroki testowe:**
1. Arrange: Mock grupy z ograniczoną listą walut (bez "XYZ")
2. Act: Wywołaj `createExpense` z nieobsługiwaną walutą
3. Assert: Sprawdź ExpenseValidationError z wiadomością o nie skonfigurowanej walucie

**Oczekiwany rezultat:** Rzucany jest ExpenseValidationError z wiadomością "Waluta {currency_code} nie jest skonfigurowana dla tej grupy"

**Priorytet:** średni

**Edge cases:**
- Waluta istnieje w systemie ale nie dla tej grupy
- Wielkość liter w kodzie waluty (case sensitivity)

**Notatki / uwagi:** Każda grupa ma własną konfigurację obsługiwanych walut

---

### UT-EXPENSE-006
**Nazwa testu:** `should_throw_ExpenseValidationError_when_expense_insertion_fails`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja błędu gdy wstawienie wydatku do bazy danych kończy się niepowodzeniem

**Wejście / dane testowe:** Prawidłowe dane wejściowe

**Setup / izolacja:**
- Wszystkie mocki walidacyjne zwracają sukces
- Mock `expenses.insert()` zwraca error

**Kroki testowe:**
1. Arrange: Mock wszystkich walidacji jako poprawne, ale expense insert kończy się błędem
2. Act: Wywołaj `createExpense`
3. Assert: Sprawdź ExpenseValidationError z wiadomością "Nie udało się utworzyć wydatku"

**Oczekiwany rezultat:** Rzucany jest ExpenseValidationError z wiadomością "Nie udało się utworzyć wydatku"

**Priorytet:** średni

**Edge cases:**
- Błąd związany z constraint violation w bazie danych
- Błąd związany z połączeniem do bazy danych

**Notatki / uwagi:** Test pokrywa błędy podczas INSERT INTO expenses

---

### UT-EXPENSE-007
**Nazwa testu:** `should_throw_ExpenseValidationError_and_cleanup_when_splits_insertion_fails`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja błędu i czyszczenia gdy wstawienie podziałów kończy się niepowodzeniem

**Wejście / dane testowe:** Prawidłowe dane z wieloma podziałami

**Setup / izolacja:**
- Expense insert zwraca sukces z ID
- Expense_splits insert zwraca error
- Mock delete na expenses aby sprawdzić czy cleanup został wykonany

**Kroki testowe:**
1. Arrange: Mock expense insert sukces, splits insert błąd
2. Act: Wywołaj `createExpense`
3. Assert: Sprawdź ExpenseValidationError i czy wykonano DELETE na utworzonym expense

**Oczekiwany rezultat:** Rzucany jest ExpenseValidationError z wiadomością "Nie udało się utworzyć podziałów wydatku" oraz wywołanie cleanup DELETE

**Priorytet:** wysoki

**Edge cases:**
- Częściowe wstawienie splits (rollback transakcyjny)
- Błąd podczas samego cleanup

**Notatki / uwagi:** Test weryfikuje mechanizm cleanup gdy splits creation fails

---

### UT-EXPENSE-008
**Nazwa testu:** `should_throw_ExpenseValidationError_when_fetch_after_creation_fails`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja błędu gdy pobranie utworzonego wydatku kończy się niepowodzeniem

**Wejście / dane testowe:** Prawidłowe dane wejściowe

**Setup / izolacja:**
- Wszystkie insert operacje zwracają sukces
- Finalne SELECT na expenses zwraca error/null

**Kroki testowe:**
1. Arrange: Mock wszystkich operacji jako poprawne oprócz final fetch
2. Act: Wywołaj `createExpense`
3. Assert: Sprawdź ExpenseValidationError z wiadomością "Nie udało się pobrać utworzonego wydatku"

**Oczekiwany rezultat:** Rzucany jest ExpenseValidationError z wiadomością "Nie udało się pobrać utworzonego wydatku"

**Priorytet:** średni

**Edge cases:**
- Fetch zwraca null zamiast error
- Fetch zwraca częściowe dane

**Notatki / uwagi:** Test pokrywa ostatnią operację fetch po pomyślnym utworzeniu

---

### UT-EXPENSE-009
**Nazwa testu:** `should_calculate_amount_in_base_currency_correctly`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja poprawnego przeliczenia kwoty na walutę bazową grupy

**Wejście / dane testowe:**
- `command`: { amount: 100, currency_code: "EUR" }
- `groupData`: { base_currency_code: "USD", group_currencies: [{ currency_code: "EUR", exchange_rate: 1.2 }] }

**Setup / izolacja:** Mock grupy z konfiguracją walut

**Kroki testowe:**
1. Arrange: Przygotuj mock z kursem wymiany EUR->USD = 1.2
2. Act: Wywołaj `createExpense` z kwotą 100 EUR
3. Assert: Sprawdź czy amount_in_base_currency = 120.00 (100 * 1.2)

**Oczekiwany rezultat:** ExpenseDTO.amount_in_base_currency = 120.00 z prawidłowym zaokrągleniem

**Priorytet:** średni

**Edge cases:**
- Kurs wymiany z większą precyzją (1.23456)
- Kwoty powodujące problemy z precyzją zmiennoprzecinkową

**Notatki / uwagi:** Test sprawdza matematykę przeliczenia walut z zaokrągleniem do 2 miejsc po przecinku

---

### UT-EXPENSE-010
**Nazwa testu:** `should_handle_empty_splits_array`

**Moduł / funkcja:** `createExpense`

**Cel testu:** Weryfikacja zachowania gdy tablica splits jest pusta

**Wejście / dane testowe:**
- `command`: { splits: [] }

**Setup / izolacja:** Standardowe mocki walidacyjne

**Kroki testowe:**
1. Arrange: Przygotuj dane z pustą tablicą splits
2. Act: Wywołaj `createExpense`
3. Assert: Sprawdź czy funkcja przechodzi walidację splits (pusta tablica jest dozwolona)

**Oczekiwany rezultat:** Funkcja przechodzi bez błędu związanego z pustymi splits

**Priorytet:** niski

**Edge cases:**
- Null zamiast pustej tablicy
- Undefined splits

**Notatki / uwagi:** Aktualna implementacja pozwala na pustą tablicę splits

---

## Module: ExpenseValidationError

### UT-EXPENSE-ERR-001
**Nazwa testu:** `should_create_ExpenseValidationError_with_message_and_details`

**Moduł / funkcja:** `ExpenseValidationError`

**Cel testu:** Weryfikacja tworzenia błędu walidacji z wiadomością i dodatkowymi detalami

**Wejście / dane testowe:**
- `message`: "Invalid expense data"
- `details`: { field: "amount", value: -100 }

**Setup / izolacja:** Brak mocków wymaganych

**Kroki testowe:**
1. Arrange: Przygotuj parametry błędu
2. Act: Utwórz nową instancję ExpenseValidationError
3. Assert: Sprawdź message, name, i details

**Oczekiwany rezultat:** Error z name="ExpenseValidationError", message="Invalid expense data", details={field: "amount", value: -100}

**Priorytet:** niski

**Edge cases:**
- Details jako undefined
- Details jako complex object

**Notatki / uwagi:** Test konstruktora klasy błędu

---

## Module: ExpenseNotFoundError

### UT-EXPENSE-ERR-002
**Nazwa testu:** `should_create_ExpenseNotFoundError_with_message`

**Moduł / funkcja:** `ExpenseNotFoundError`

**Cel testu:** Weryfikacja tworzenia błędu braku wydatku

**Wejście / dane testowe:**
- `message`: "Expense with ID 123 not found"

**Setup / izolacja:** Brak mocków wymaganych

**Kroki testowe:**
1. Arrange: Przygotuj wiadomość błędu
2. Act: Utwórz nową instancję ExpenseNotFoundError
3. Assert: Sprawdź message i name

**Oczekiwany rezultat:** Error z name="ExpenseNotFoundError", message="Expense with ID 123 not found"

**Priorytet:** niski

**Edge cases:**
- Pusta wiadomość
- Bardzo długa wiadomość

**Notatki / uwagi:** Test konstruktora klasy błędu

---

## Podsumowanie

Najważniejsze moduły do pokrycia unit testami to `createExpense` (10 testów) jako główna funkcja biznesowa zawierająca złożoną logikę walidacji i operacji bazodanowych. Klasy błędów mają niższy priorytet (2 testy) ze względu na prostotę konstruktorów. Główny nacisk powinien być położony na testy walidacyjne (grupy członkowskie, waluty) oraz scenariusze błędów bazodanowych z odpowiednim mockowaniem Supabase.
